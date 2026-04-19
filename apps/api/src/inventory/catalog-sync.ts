import type { PrismaClient } from '@prisma/client';
import type { Unit } from '@prisma/client';

export type CatalogSyncResult = {
  factoryShopCode: string;
  targetShopCode: string;
  factoryProductCount: number;
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  imagesCreated: number;
};

export type CatalogSyncBatchResult = CatalogSyncResult & {
  batchSize: number;
  nextSkip: number;
  completed: boolean;
};

function defaultRetailOpeningQty(unit: Unit | null | undefined): number {
  return unit === 'KG' ? 20 : 100;
}

const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_BATCH = 6;

async function assertFactoryAndTarget(
  prisma: PrismaClient,
  targetShopCode: string,
) {
  const factory = await prisma.shop.findFirst({ where: { isFactory: true } });
  if (!factory) {
    throw new Error(
      'No factory shop (isFactory=true). Mark a warehouse shop as factory first.',
    );
  }
  const target = await prisma.shop.findUnique({
    where: { shopCode: targetShopCode },
  });
  if (!target) {
    throw new Error(`Shop "${targetShopCode}" not found`);
  }
  if (factory.shopCode === target.shopCode) {
    throw new Error('Choose a retail shop, not the factory.');
  }
  return { factory, target };
}

/**
 * Process one page of factory products (for HTTP: many short requests instead of one long one).
 */
export async function syncFactoryCatalogToShopBatch(
  prisma: PrismaClient,
  targetShopCode: string,
  skip: number,
  take: number = DEFAULT_BATCH,
): Promise<CatalogSyncBatchResult> {
  const { factory, target } = await assertFactoryAndTarget(prisma, targetShopCode);

  const totalFactoryProducts = await prisma.product.count({
    where: { shopCode: factory.shopCode },
  });

  const factoryProducts = await prisma.product.findMany({
    where: { shopCode: factory.shopCode },
    include: { variants: true, images: true },
    orderBy: { name: 'asc' },
    skip,
    take,
  });

  let productsCreated = 0;
  let productsUpdated = 0;
  let variantsCreated = 0;
  let variantsUpdated = 0;
  let imagesCreated = 0;

  for (const fp of factoryProducts) {
    let tp = await prisma.product.findFirst({
      where: { shopCode: target.shopCode, name: fp.name },
    });

    if (!tp) {
      tp = await prisma.product.create({
        data: {
          name: fp.name,
          description: fp.description,
          categoryId: fp.categoryId,
          shopCode: target.shopCode,
          isActive: fp.isActive,
          isListedOnWebsite: fp.isListedOnWebsite,
        },
      });
      productsCreated += 1;

      for (const img of fp.images) {
        await prisma.productImage.create({
          data: { url: img.url, productId: tp.id },
        });
        imagesCreated += 1;
      }
    } else {
      await prisma.product.update({
        where: { id: tp.id },
        data: {
          description: fp.description,
          categoryId: fp.categoryId,
          isActive: fp.isActive,
          isListedOnWebsite: fp.isListedOnWebsite,
        },
      });
      productsUpdated += 1;
    }

    const existingVariants = await prisma.productVariant.findMany({
      where: { productId: tp.id },
    });
    const byName = new Map(existingVariants.map((v) => [v.name, v]));

    for (const fv of fp.variants) {
      const hit = byName.get(fv.name);
      if (hit) {
        const repairBarcode =
          !!fv.barcode &&
          UUID_LIKE.test(hit.barcode) &&
          !UUID_LIKE.test(fv.barcode);

        await prisma.productVariant.update({
          where: { id: hit.id },
          data: {
            price: fv.price,
            costPrice: fv.costPrice,
            hsnCode: fv.hsnCode,
            sku: fv.sku,
            unit: fv.unit,
            ...(repairBarcode ? { barcode: fv.barcode } : {}),
          },
        });
        variantsUpdated += 1;
      } else {
        await prisma.productVariant.create({
          data: {
            productId: tp.id,
            name: fv.name,
            price: fv.price,
            costPrice: fv.costPrice,
            hsnCode: fv.hsnCode,
            sku: fv.sku,
            unit: fv.unit,
            barcode: fv.barcode,
            quantity: defaultRetailOpeningQty(fv.unit),
          },
        });
        variantsCreated += 1;
      }
    }
  }

  const batchSize = factoryProducts.length;
  const nextSkip = skip + batchSize;
  const completed = nextSkip >= totalFactoryProducts || batchSize === 0;

  return {
    factoryShopCode: factory.shopCode,
    targetShopCode: target.shopCode,
    factoryProductCount: totalFactoryProducts,
    productsCreated,
    productsUpdated,
    variantsCreated,
    variantsUpdated,
    imagesCreated,
    batchSize,
    nextSkip,
    completed,
  };
}

/**
 * Full catalog sync (CLI / scripts): runs batches in-process so there is no HTTP timeout.
 */
export async function syncFactoryCatalogToShop(
  prisma: PrismaClient,
  targetShopCode: string,
  batchSize: number = DEFAULT_BATCH,
): Promise<CatalogSyncResult> {
  const { factory, target } = await assertFactoryAndTarget(
    prisma,
    targetShopCode,
  );

  const totalFactoryProducts = await prisma.product.count({
    where: { shopCode: factory.shopCode },
  });

  let productsCreated = 0;
  let productsUpdated = 0;
  let variantsCreated = 0;
  let variantsUpdated = 0;
  let imagesCreated = 0;

  let skip = 0;
  while (skip < totalFactoryProducts) {
    const batch = await syncFactoryCatalogToShopBatch(
      prisma,
      targetShopCode,
      skip,
      batchSize,
    );
    productsCreated += batch.productsCreated;
    productsUpdated += batch.productsUpdated;
    variantsCreated += batch.variantsCreated;
    variantsUpdated += batch.variantsUpdated;
    imagesCreated += batch.imagesCreated;
    skip = batch.nextSkip;
    if (batch.batchSize === 0) break;
  }

  return {
    factoryShopCode: factory.shopCode,
    targetShopCode: target.shopCode,
    factoryProductCount: totalFactoryProducts,
    productsCreated,
    productsUpdated,
    variantsCreated,
    variantsUpdated,
    imagesCreated,
  };
}
