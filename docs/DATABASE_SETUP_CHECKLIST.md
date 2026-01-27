# Database Setup Checklist

Use this checklist when setting up a new LifeAligner database or verifying an existing one.

## ✅ Pre-Setup

- [ ] Supabase project created
- [ ] Environment variables added to `.env.local`:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ Tables Setup

### Profiles Table

- [ ] Table `profiles` created
- [ ] All columns present (id, created_at, updated_at, full_name, avatar_url, role, subscription_status, stripe_customer_id, workbook_completed, workbook_version)
- [ ] Primary key constraint on `id`
- [ ] Foreign key to `auth.users(id)` with CASCADE
- [ ] **VERIFIED:** `id` column has NO default (run: `SELECT column_default FROM information_schema.columns WHERE table_name='profiles' AND column_name='id'`)
- [ ] **VERIFIED:** `role` default is `'user'::text` (not `'''user'''::text`)
- [ ] **VERIFIED:** `subscription_status` default is `'free'::text` (not `'''free'''::text`)

### Workbook Entries Table

- [ ] Table `workbook_entries` created
- [ ] All columns present (id, user_id, category, content, created_at, updated_at)
- [ ] Primary key constraint on `id`
- [ ] UNIQUE constraint on `(user_id, category)`
- [ ] Foreign key to `profiles(id)` with CASCADE
- [ ] Index on `user_id` created
- [ ] Index on `category` created

---

## ✅ Row Level Security (RLS)

### Profiles Table

- [ ] RLS enabled on `profiles`
- [ ] Policy: "Users can view own profile" (SELECT)
- [ ] Policy: "Users can update own profile" (UPDATE)
- [ ] Policy: "Users can insert own profile" (INSERT)

**Verify with:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
```

### Workbook Entries Table

- [ ] RLS enabled on `workbook_entries`
- [ ] Policy: "Users can view own entries" (SELECT)
- [ ] Policy: "Users can insert own entries" (INSERT)
- [ ] Policy: "Users can update own entries" (UPDATE)
- [ ] Policy: "Users can delete own entries" (DELETE)

**Verify with:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'workbook_entries';
```

---

## ✅ Triggers & Functions

- [ ] Function `handle_new_user()` created
- [ ] Function has `SECURITY DEFINER` and `SET search_path = public, pg_catalog`
- [ ] Trigger `on_auth_user_created` created on `auth.users`
- [ ] Trigger fires AFTER INSERT

**Verify with:**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';
```

---

## ✅ Final Verification Queries

Run these to verify everything is set up correctly:

### 1. Check Table Structures
```sql
-- Profiles columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Workbook entries columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workbook_entries'
ORDER BY ordinal_position;
```

### 2. Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'workbook_entries');
```

**Expected Result:**
| tablename | rowsecurity |
|-----------|-------------|
| profiles | true |
| workbook_entries | true |

### 3. Check Policies Exist
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'workbook_entries')
ORDER BY tablename, policyname;
```

**Expected:** 7 total policies (3 for profiles, 4 for workbook_entries)

### 4. Check Indexes
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'workbook_entries'
AND indexname LIKE 'idx_%';
```

**Expected:**
- `idx_workbook_entries_user_id`
- `idx_workbook_entries_category`

### 5. Check Trigger Exists
```sql
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name = 'on_auth_user_created';
```

**Expected:** 1 row with AFTER INSERT on auth.users

---

## ✅ Test Authentication Flow

### Test Signup
1. [ ] Create test user via Supabase Auth or signup page
2. [ ] Verify user appears in `auth.users`
3. [ ] Verify profile automatically created in `profiles` table
4. [ ] Verify `full_name` populated correctly

**Test Query:**
```sql
SELECT 
  au.id,
  au.email,
  p.full_name,
  p.role,
  p.subscription_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;
```

### Test RLS Policies

**As authenticated user:**
```typescript
// Should succeed - user can read own profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Should succeed - user can insert own entry
const { data, error } = await supabase
  .from('workbook_entries')
  .insert({
    user_id: user.id,
    category: 'values',
    content: { test: 'data' }
  });
```

---

## 🚨 Common Issues & Fixes

### Issue: Signup creates user but no profile

**Cause:** Trigger not working

**Fix:**
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If missing, create it:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Issue: User can't read their own data

**Cause:** RLS policies not working

**Fix:**
```sql
-- Verify RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workbook_entries ENABLE ROW LEVEL SECURITY;

-- Recreate policies if needed (see DATABASE_SCHEMA.md)
```

### Issue: Triple-quoted defaults

**Symptom:** Role shows as `'user'` instead of `user`

**Fix:**
```sql
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';
ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'free';
```

### Issue: Can't insert profiles (duplicate key)

**Cause:** `id` column has `DEFAULT auth.uid()`

**Fix:**
```sql
ALTER TABLE profiles ALTER COLUMN id DROP DEFAULT;
```

---

## 📝 Post-Setup Notes

- [ ] Documentation updated in `docs/DATABASE_SCHEMA.md`
- [ ] Schema backed up
- [ ] Test user created and verified
- [ ] RLS policies tested
- [ ] Ready for application development

**Date Completed:** _________________

**Verified By:** _________________
