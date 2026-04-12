import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SHOPS ---');
  const shops = await prisma.shop.findMany();
  console.table(shops.map(s => ({ code: s.shopCode, name: s.name, factory: s.isFactory })));

  console.log('\n--- PRODUCT COUNTS ---');
  const counts = await prisma.product.groupBy({
    by: ['shopCode'],
    _count: { _all: true }
  });
  console.table(counts.map(c => ({ shopCode: c.shopCode, count: c._count._all })));
  
  console.log('\n--- SAMPLE PRODUCTS (Any Shop) ---');
  const sample = await prisma.product.findMany({ take: 5 });
  console.table(sample.map(p => ({ id: p.id, name: p.name, shopCode: p.shopCode })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
