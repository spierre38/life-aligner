# Database Quick Reference

Quick copy-paste queries for common operations.

## 🔍 Verification Queries

### Check if everything is set up correctly
```sql
-- Quick health check (run this first!)
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') as profiles_exists,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workbook_entries') as workbook_exists,
  (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') as profiles_rls,
  (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workbook_entries') as workbook_rls,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as trigger_exists;
```

**Expected Result:**
| profiles_exists | workbook_exists | profiles_rls | workbook_rls | trigger_exists |
|-----------------|-----------------|--------------|--------------|----------------|
| 1 | 1 | true | true | 1 |

---

## 👤 User Management

### View recent users with profiles
```sql
SELECT 
  au.id,
  au.email,
  au.created_at as signed_up_at,
  p.full_name,
  p.role,
  p.subscription_status,
  p.workbook_completed
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;
```

### Find user by email
```sql
SELECT 
  au.id,
  au.email,
  p.full_name,
  p.workbook_completed
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'user@example.com';
```

### Count total users
```sql
SELECT COUNT(*) as total_users FROM auth.users;
```

---

## 📊 Progress Tracking

### Check user's worksheet completion
```sql
SELECT 
  p.full_name,
  p.email,
  ARRAY_AGG(we.category) as completed_worksheets,
  COUNT(we.id) as completed_count
FROM auth.users p
LEFT JOIN public.workbook_entries we ON p.id = we.user_id
WHERE p.id = 'USER_ID_HERE'
GROUP BY p.id, p.full_name, p.email;
```

### See all users' progress
```sql
SELECT 
  au.email,
  p.full_name,
  COUNT(we.id) as worksheets_completed,
  ARRAY_AGG(we.category) as completed_categories
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.workbook_entries we ON p.id = we.user_id
GROUP BY au.email, p.full_name
ORDER BY worksheets_completed DESC;
```

### Users who completed all worksheets
```sql
SELECT 
  au.email,
  p.full_name,
  p.created_at as signed_up,
  MAX(we.updated_at) as last_worksheet_update
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
JOIN public.workbook_entries we ON p.id = we.user_id
GROUP BY au.email, p.full_name, p.created_at
HAVING COUNT(DISTINCT we.category) = 4  -- Adjust based on total worksheets
ORDER BY last_worksheet_update DESC;
```

---

## 📝 Workbook Data

### View user's values worksheet
```sql
SELECT 
  content
FROM workbook_entries
WHERE user_id = 'USER_ID_HERE'
AND category = 'values';
```

### View all worksheets for a user
```sql
SELECT 
  category,
  content,
  updated_at
FROM workbook_entries
WHERE user_id = 'USER_ID_HERE'
ORDER BY updated_at DESC;
```

### Find users who selected a specific value
```sql
SELECT 
  au.email,
  p.full_name,
  we.content->'selected_values' as values
FROM auth.users au
JOIN public.profiles p ON au.id = p.id
JOIN public.workbook_entries we ON p.id = we.user_id
WHERE we.category = 'values'
AND we.content::text LIKE '%Authenticity%';
```

---

## 🔧 Maintenance

### Delete a user completely (cascades to profile and workbook entries)
```sql
-- ⚠️ DANGEROUS - This deletes the user and all their data!
DELETE FROM auth.users WHERE id = 'USER_ID_HERE';
```

### Reset user's worksheets (keep profile)
```sql
DELETE FROM workbook_entries WHERE user_id = 'USER_ID_HERE';
```

### Update user's subscription status
```sql
UPDATE profiles 
SET subscription_status = 'paid'
WHERE id = 'USER_ID_HERE';
```

### Mark workbook as completed
```sql
UPDATE profiles 
SET workbook_completed = true
WHERE id = 'USER_ID_HERE';
```

---

## 📈 Analytics

### Worksheet completion rate
```sql
SELECT 
  we.category,
  COUNT(DISTINCT we.user_id) as users_completed,
  ROUND(100.0 * COUNT(DISTINCT we.user_id) / (SELECT COUNT(*) FROM auth.users), 2) as completion_percentage
FROM workbook_entries we
GROUP BY we.category
ORDER BY users_completed DESC;
```

### Average time to complete first worksheet
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (we.created_at - au.created_at)) / 3600) as avg_hours_to_first_worksheet
FROM auth.users au
JOIN workbook_entries we ON au.id = we.user_id
WHERE we.category = 'values';
```

### Daily signups
```sql
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signups
FROM auth.users
GROUP BY DATE(created_at)
ORDER BY signup_date DESC
LIMIT 30;
```

---

## 🐛 Debugging

### Check if RLS is blocking queries
```sql
-- Run as admin (should see all data)
SELECT * FROM profiles;

-- Run as user (should only see own profile)
-- This simulates what the app sees
SELECT * FROM profiles WHERE auth.uid() = id;
```

### Find orphaned profiles (no auth.users entry)
```sql
SELECT p.*
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;
```

### Find users without profiles (trigger failed)
```sql
SELECT au.*
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### Check for duplicate workbook entries (shouldn't exist)
```sql
SELECT user_id, category, COUNT(*)
FROM workbook_entries
GROUP BY user_id, category
HAVING COUNT(*) > 1;
```

---

## 🔐 Security Checks

### Verify RLS policies exist
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test if trigger is working
```sql
-- Check recent profile creations match user creations
SELECT 
  au.email,
  au.created_at as user_created,
  p.created_at as profile_created,
  EXTRACT(EPOCH FROM (p.created_at - au.created_at)) as seconds_difference
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;
```

---

## 🔄 Common Fixes

### Recreate missing profile for existing user
```sql
INSERT INTO profiles (id, full_name)
SELECT 
  id, 
  raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id = 'USER_ID_HERE'
ON CONFLICT (id) DO NOTHING;
```

### Fix corrupted defaults
```sql
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'free';
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;
```

### Rebuild all indexes
```sql
REINDEX TABLE profiles;
REINDEX TABLE workbook_entries;
```

---

## 📦 Backup & Restore

### Export user data (for support)
```sql
-- Export specific user's complete data
SELECT jsonb_build_object(
  'profile', (SELECT row_to_json(p.*) FROM profiles p WHERE id = 'USER_ID_HERE'),
  'workbook_entries', (SELECT jsonb_agg(row_to_json(we.*)) FROM workbook_entries we WHERE user_id = 'USER_ID_HERE')
) as user_data;
```

### Count records per table
```sql
SELECT 
  'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 
  'workbook_entries', COUNT(*) FROM workbook_entries;
```
