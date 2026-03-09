# 🚀 Rakshak - Quick Start Guide

## 1-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Database Migration
1. Open: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/sql/new
2. Copy entire contents of `supabase/migrations/00_complete_schema.sql`
3. Paste and click "Run"
4. Wait for success message

### Step 3: Create Storage Bucket
1. Open: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/storage/buckets
2. Click "New Bucket"
3. Name: `evidence`
4. Public: **OFF**
5. Click "Create"

### Step 4: Apply Storage Policies
1. Open: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/sql/new
2. Copy contents of `supabase/migrations/01_storage_policies.sql`
3. Paste and click "Run"

### Step 5: Start the App
```bash
npm run dev
```

Open: http://localhost:3000

## That's It! 🎉

Your Rakshak application is now running!

### Create Your First Account
1. Go to http://localhost:3000/signup
2. Sign up with an email
3. You're logged in as a student by default

### Promote to Root (Admin)
Run this in Supabase SQL Editor (replace `YOUR_USER_ID`):
```sql
UPDATE public.profiles 
SET role = 'root', is_verified = true 
WHERE id = 'YOUR_USER_ID';
```

To find your user ID, run:
```sql
SELECT id, email FROM auth.users;
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Run: `npm run dev -- --port 3001` |
| Supabase errors | Check `.env` file exists with correct credentials |
| Tables not found | Re-run the migration SQL |
| Can't upload files | Create the `evidence` storage bucket |

## Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv
- **SQL Editor**: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/sql
- **Storage**: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/storage
- **Authentication**: https://supabase.com/dashboard/project/sbswlwyxgsywcceuywsv/auth/users

Need more help? See `SETUP_INSTRUCTIONS.md`
