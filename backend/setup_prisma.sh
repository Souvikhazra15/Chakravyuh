#!/bin/bash
# Prisma Database Setup Script

echo "🔄 Setting up Prisma with PostgreSQL..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# 2. Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# 3. Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# 4. Seed database (optional)
echo "🌱 Loading sample data..."
python load_sample_data.py

echo "✅ Setup complete!"
echo "📍 Start backend: python -m uvicorn app.main:app --reload"
