/**
 * recode-barcodes.ts
 * Replaces UUID-format barcodes on ProductVariant with short CS-prefixed codes.
 *
 * Run from repo root:
 *   npx tsx /tmp/recode-barcodes.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function main() {
    // Find the highest existing CS barcode number so we don't collide
    const lastCs = await prisma.productVariant.findFirst({
        where: { barcode: { startsWith: 'CS' } },
        orderBy: { createdAt: 'desc' },
    });

    let counter = 1;
    if (lastCs?.barcode) {
        const n = parseInt(lastCs.barcode.replace(/^CS/, ''), 10);
        if (!Number.isNaN(n)) counter = n + 1;
    }

    // Find all variants with UUID-format barcodes
    const variants = await prisma.productVariant.findMany({
        select: { id: true, barcode: true },
        orderBy: { createdAt: 'asc' },
    });

    const toFix = variants.filter((v) => UUID_RE.test(v.barcode));
    console.log(`Found ${toFix.length} variants with UUID barcodes. Recoding…`);

    for (const v of toFix) {
        const newBarcode = `CS${String(counter).padStart(6, '0')}`;
        await prisma.productVariant.update({
            where: { id: v.id },
            data: { barcode: newBarcode },
        });
        console.log(`  ${v.barcode.slice(0, 8)}… → ${newBarcode}`);
        counter++;
    }

    console.log('Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
