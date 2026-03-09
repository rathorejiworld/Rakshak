-- This migration disables email confirmation requirement for new signups
-- Users will be immediately confirmed after signup without needing email verification

-- Note: Run this in your Supabase SQL Editor or via migration
-- Go to Supabase Dashboard > Project Settings > Auth > Email Templates > Email Confirmations > Disable

-- Alternatively, you can update the auth configuration via the API:
-- PATCH /admin/settings with { "mailer_autoconfirm": true } for email provider

-- For now, the best approach is through the Supabase Dashboard:
-- 1. Go to Authentication > Providers > Email
-- 2. Toggle OFF "Confirm email"
-- 3. Save changes

-- If you want to enforce this via SQL (for reference):
-- This would disable the email confirmation requirement
-- NOTE: Supabase may not expose this directly via SQL, so use Dashboard instead
