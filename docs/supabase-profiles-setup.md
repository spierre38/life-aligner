# Creating the Profiles Table in Supabase

Step-by-step guide to create the profiles table with auto-creation trigger.

---

## Part 1: Create the Table

**Go to Supabase Dashboard:**
1. Open your Supabase project
2. Click **"Table Editor"** in left sidebar
3. Click **"Create a new table"** button

**Table settings:**
- **Name:** `profiles`
- **Enable Row Level Security (RLS):** ✅ YES (checked)

**Add these columns:**

| Column Name | Type | Default Value | Nullable | Notes |
|------------|------|---------------|----------|-------|
| `id` |       uuid |      - |           No | Primary Key |
| `full_name` | text | - | Yes | User's display name |
| `avatar_url` | text | - | Yes | Profile picture URL |
| `role` | text | `'user'` | No | 'user' or 'admin' |
| `subscription_status` | text | `'free'` | No | 'free', 'paid', or 'lifetime' |
| `stripe_customer_id` | text | - | Yes | Stripe customer ID |
| `workbook_completed` | bool | `false` | No | Has user finished workbook |
| `workbook_version` | int4 | `1` | No | Tracks schema version |
| `created_at` | timestamptz | `now()` | No | Auto-set on creation |
| `updated_at` | timestamptz | `now()` | No | Auto-set on update |

**Important for `id` column:**
- Set as **Primary Key**
- Add **Foreign Key** reference: `auth.users(id)` with `ON DELETE CASCADE`

**Click "Save"** to create the table.

---

## Part 2: Auto-Create Profile Trigger

This makes a profile automatically when someone signs up.

**Go to SQL Editor:**
1. Click **"SQL Editor"** in left sidebar
2. Click **"New query"**

**Paste this code:**

```sql
-- Function that creates a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert a new profile row
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger that runs the function on new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

**Click "Run"** to execute.

**What this does:**
- When someone signs up (row added to `auth.users`)
- Automatically creates matching row in `profiles` table
- Copies their name from signup form

---

## Part 3: Row Level Security (RLS) Policies

Back in **SQL Editor**, run this:

```sql
-- Users can read their own profile
create policy "Users can view own profile"
on profiles for select
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
on profiles for update
using (auth.uid() = id);

-- Admins can read all profiles (for later)
create policy "Admins can view all profiles"
on profiles for select
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
```

**What this does:**
- Users can only see/edit their own profile
- Admins can see all profiles (for user management)
- Security built into database level

---

## Part 4: Test It

**Create a test query:**

```sql
-- See all profiles (should be empty for now)
select * from profiles;
```

**When you add your first user** (via auth signup), a profile will auto-create!

---

## ✅ Checklist

- [ ] Created `profiles` table with all 10 columns
- [ ] Set `id` as primary key with foreign key to `auth.users`
- [ ] Enabled Row Level Security (RLS)
- [ ] Created auto-create trigger function
- [ ] Added RLS policies
- [ ] Tested with query

**Once complete, profiles will auto-create when users sign up!**
