import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();

const configService = new ConfigService();
const redis = new Redis(configService.get('REDIS_URL'));

async function flushCache() {
  console.info('ℹ️ Flushing cache...');
  await redis.flushall();
  console.info('ℹ️ Cache flushed successfully');
}

const main = async () => {
  console.info('ℹ️ Starting database seeding...');

  // Add your seeding logic here if needed
  // Example: await prisma.user.createMany({ data: [...] });

  console.info('ℹ️ Database seeding completed successfully');
  await flushCache();
};

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });
