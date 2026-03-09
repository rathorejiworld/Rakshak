# 🚀 START HERE - Rakshak Project

## Quick Start (5 minutes)

### Method 1: Automated Script (Linux/Mac)

```bash
# Make script executable
chmod +x RUN_PROJECT.sh

# Run setup and start server
./RUN_PROJECT.sh start
```

### Method 2: Automated Script (Windows)

```cmd
RUN_PROJECT.bat start
```

### Method 3: Manual Steps

```bash
# 1. Install dependencies
npm install

# 2. Verify setup
npm run setup:check

# 3. Start development server
npm run dev
```

## ⚡ One-Command Setup

```bash
npm install && npm run dev
```

The app will open automatically at http://localhost:3000

## 📋 Before First Run

### ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] .env file created with Supabase credentials
- [ ] Database migrations run in Supabase
- [ ] Storage bucket 'evidence' created
- [ ] Storage policies applied

### 🗄️ Database Setup (Required)

1. **Open Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/sql/new
   ```

2. **Run Migration**
   - Copy entire file: `supabase/migrations/00_complete_schema.sql`
   - Paste in SQL Editor
   - Click "Run"

3. **Create Storage Bucket**
   - Go to: Storage → New Bucket
   - Name: `evidence`
   - Public: **OFF**

4. **Apply Storage Policies**
   - Copy file: `supabase/migrations/01_storage_policies.sql`
   - Run in SQL Editor

## 🎯 Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Run ESLint

# Setup
npm run setup        # Install + verify setup
npm run setup:check  # Check project configuration
```

## 🔧 Troubleshooting

### Port 3000 already in use
```bash
# Use different port
npm run dev -- --port 3001
```

### Environment variables not found
```bash
# Check .env file exists
ls -la .env

# Verify contents
cat .env
```

### Database connection fails
- Verify Supabase credentials in .env
- Check migrations ran successfully
- Confirm you have internet connection

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Documentation

- **Quick Start**: QUICKSTART.md
- **Detailed Setup**: SETUP_INSTRUCTIONS.md
- **API Reference**: See Rakshak_spec.txt
- **Architecture**: README.md

## 🆘 Getting Help

1. Check SETUP_INSTRUCTIONS.md
2. Review browser console for errors
3. Check Supabase Dashboard logs
4. Verify all environment variables

## 🎉 Success!

When everything is working, you'll see:

