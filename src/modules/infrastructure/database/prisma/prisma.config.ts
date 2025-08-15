import { Prisma } from '@prisma/client';

export const prismaConfig: Prisma.PrismaClientOptions = {
  log: ['error', 'warn'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Pooled connection for regular operations
    },
  },
  // Enhanced connection management for Neon
  // This helps prevent "connection closed" errors
  // Note: Prisma handles connection pooling automatically
  // but we can optimize for Neon's PgBouncer
};

// Configuration for direct connections (migrations, schema operations)
export const directPrismaConfig: Prisma.PrismaClientOptions = {
  log: ['error', 'warn'],
  errorFormat: 'minimal',
  datasources: {
    db: {
      url: process.env.DIRECT_URL, // Direct connection for migrations
    },
  },
};

export const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  prismaConfig.log = ['query', 'error', 'warn'];
  directPrismaConfig.log = ['query', 'error', 'warn'];
}
