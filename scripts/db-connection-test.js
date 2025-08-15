#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests both pooled and direct connections to Neon database
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function testConnections() {
  console.log('🔍 Testing Neon Database Connections...\n');

  // Test pooled connection (DATABASE_URL)
  console.log('1️⃣ Testing Pooled Connection (PgBouncer)...');
  try {
    const pooledPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    await pooledPrisma.$connect();
    console.log('✅ Pooled connection successful');
    
    const result = await pooledPrisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test passed:', result);
    
    await pooledPrisma.$disconnect();
    console.log('✅ Pooled connection closed\n');
  } catch (error) {
    console.error('❌ Pooled connection failed:', error.message);
  }

  // Test direct connection (DIRECT_URL)
  console.log('2️⃣ Testing Direct Connection...');
  try {
    const directPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DIRECT_URL,
        },
      },
    });

    await directPrisma.$connect();
    console.log('✅ Direct connection successful');
    
    const result = await directPrisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test passed:', result);
    
    await directPrisma.$disconnect();
    console.log('✅ Direct connection closed\n');
  } catch (error) {
    console.error('❌ Direct connection failed:', error.message);
  }

  console.log('📊 Connection Summary:');
  console.log(`   Pooled URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Direct URL: ${process.env.DIRECT_URL ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    console.log('\n⚠️  Make sure both DATABASE_URL and DIRECT_URL are set in your .env file');
    console.log('   DATABASE_URL should use the pooled connection (with ?pgbouncer=true)');
    console.log('   DIRECT_URL should use the direct connection (without pgbouncer)');
  }
}

testConnections()
  .catch(console.error)
  .finally(() => process.exit(0));
