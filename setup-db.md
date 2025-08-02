# Database Setup

## Option 1: Local PostgreSQL (Recommended for Development)

### Install PostgreSQL:
```bash
# macOS
brew install postgresql
brew services start postgresql

# Create database
createdb zora_tba_coins

# Update .env with correct credentials
DATABASE_URL="postgresql://$(whoami)@localhost:5432/zora_tba_coins?schema=public"
```

### Run migrations:
```bash
npx prisma migrate dev --name init
```

## Option 2: Docker PostgreSQL
```bash
docker run --name zora-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=zora_tba_coins -p 5432:5432 -d postgres:15

# Update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/zora_tba_coins?schema=public"
```

## Option 3: Cloud Database (Production)
Use services like:
- Supabase (free tier available)
- Railway
- Neon
- PlanetScale

Update DATABASE_URL in .env with your cloud database connection string.