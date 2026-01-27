# LifeAligner Database Schema Documentation

Last Updated: January 27, 2026

## Overview

LifeAligner uses Supabase (PostgreSQL) for authentication and data storage. The database consists of two main tables: `profiles` and `workbook_entries`.

## Architecture

```
auth.users (Supabase built-in)
    ↓
    └─ Trigger: on_auth_user_created
           ↓
profiles (custom table, 1:1 with auth.users)
    ↓
workbook_entries (user's workbook responses)
```

---

## Tables

### 1. `profiles`

Stores user-specific data beyond basic authentication.

**Relationship:** One-to-one with `auth.users`

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | - | Primary key, references `auth.users.id` |
| `created_at` | `timestamptz` | NO | `now()` | When profile was created |
| `updated_at` | `timestamptz` | NO | `now()` | Last profile update |
| `full_name` | `text` | YES | `NULL` | User's full name |
| `avatar_url` | `text` | YES | `NULL` | Profile picture URL |
| `role` | `text` | NO | `'user'` | User role: `'user'` or `'admin'` |
| `subscription_status` | `text` | NO | `'free'` | Subscription: `'free'`, `'paid'`, `'lifetime'` |
| `stripe_customer_id` | `text` | YES | `NULL` | Stripe customer ID for payments |
| `workbook_completed` | `boolean` | NO | `false` | Has user completed all worksheets? |
| `workbook_version` | `integer` | NO | `1` | Tracks workbook schema version |

#### Constraints

```sql
PRIMARY KEY (id)
FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE
```

#### Row Level Security (RLS)

**Enabled:** ✅ Yes

**Policies:**
- `Users can view own profile` - Users can SELECT their own profile
- `Users can update own profile` - Users can UPDATE their own profile
- `Users can insert own profile` - Users can INSERT their own profile

```sql
-- View own profile
USING (auth.uid() = id)

-- Update own profile
USING (auth.uid() = id)

-- Insert own profile
WITH CHECK (auth.uid() = id)
```

#### Automatic Profile Creation

When a user signs up via Supabase Auth, a profile is **automatically created** using a database trigger.

**Trigger:** `on_auth_user_created`
**Function:** `handle_new_user()`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2. `workbook_entries`

Stores user's LifeFrame and Roadmap worksheet responses.

**Relationship:** Many-to-one with `profiles` (each user can have multiple entries)

#### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | - | References `profiles.id` |
| `category` | `text` | NO | - | Worksheet type (see categories below) |
| `content` | `jsonb` | NO | - | Worksheet data (flexible structure) |
| `created_at` | `timestamptz` | YES | `now()` | When entry was created |
| `updated_at` | `timestamptz` | YES | `now()` | Last entry update |

#### Valid Categories

- `values` - User's selected values and priorities
- `interests` - User's interests (existing + exploring)
- `life_categories` - User's life categories including Purpose
- `roadmap` - User's goals, behavior changes, and activities

#### Constraints

```sql
PRIMARY KEY (id)
UNIQUE (user_id, category) -- One entry per category per user
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
```

#### Indexes

```sql
CREATE INDEX idx_workbook_entries_user_id ON workbook_entries(user_id);
CREATE INDEX idx_workbook_entries_category ON workbook_entries(category);
```

#### Row Level Security (RLS)

**Enabled:** ✅ Yes

**Policies:**
- `Users can view own entries` - Users can SELECT their own entries
- `Users can insert own entries` - Users can INSERT their own entries
- `Users can update own entries` - Users can UPDATE their own entries
- `Users can delete own entries` - Users can DELETE their own entries

```sql
-- All policies use:
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

---

## Content Structure Examples

### Values Entry

```json
{
  "category": "values",
  "content": {
    "selected_values": [
      { "name": "Authenticity", "priority": 1 },
      { "name": "Compassion", "priority": 2 },
      { "name": "Courage", "priority": 3 }
    ]
  }
}
```

### Interests Entry

```json
{
  "category": "interests",
  "content": {
    "existing": ["Reading", "Hiking", "Coding"],
    "exploring": ["Photography", "Guitar"]
  }
}
```

### Life Categories Entry

```json
{
  "category": "life_categories",
  "content": {
    "categories": [
      {
        "name": "Health",
        "sub_categories": ["Physical Health", "Mental Health"]
      },
      {
        "name": "Purpose",
        "sub_categories": ["Help Others", "Help the Environment"]
      }
    ]
  }
}
```

### Roadmap Entry

```json
{
  "category": "roadmap",
  "content": {
    "life_category": "Health",
    "goals": [
      {
        "goal": "Lose 10 pounds",
        "type": "goal",
        "activities": [
          "Exercise 5x per week",
          "Stop eating after 8pm",
          "Cut out bread"
        ]
      }
    ]
  }
}
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled to ensure users can only access their own data.

**Key Principle:** `auth.uid() = user_id` or `auth.uid() = id`

This means:
- ✅ Users can read/write their own data
- ❌ Users cannot read/write other users' data
- ✅ Server-side operations (triggers) bypass RLS with `SECURITY DEFINER`

### Cascading Deletes

When a user is deleted from `auth.users`:
1. Their `profiles` row is deleted (CASCADE)
2. All their `workbook_entries` are deleted (CASCADE)

This ensures no orphaned data remains in the database.

---

## Common Queries

### Get User Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Get All User's Workbook Entries

```typescript
const { data, error } = await supabase
  .from('workbook_entries')
  .select('*')
  .eq('user_id', userId);
```

### Get Specific Worksheet (e.g., Values)

```typescript
const { data, error } = await supabase
  .from('workbook_entries')
  .select('content')
  .eq('user_id', userId)
  .eq('category', 'values')
  .single();
```

### Save/Update Worksheet (Upsert)

```typescript
const { data, error} = await supabase
  .from('workbook_entries')
  .upsert({
    user_id: userId,
    category: 'values',
    content: { selected_values: [...] }
  }, {
    onConflict: 'user_id,category' // Uses UNIQUE constraint
  });
```

### Check User Progress

```typescript
const { data, error } = await supabase
  .from('workbook_entries')
  .select('category')
  .eq('user_id', userId);

const completed = data?.map(entry => entry.category) || [];
// completed = ['values', 'interests', ...]
```

---

## Migration History

### Initial Setup (January 27, 2026)

1. Created `profiles` table with user metadata
2. Created `workbook_entries` table with JSONB content
3. Added automatic profile creation trigger
4. Enabled RLS on all tables
5. Created indexes for performance

### Fixes Applied (January 27, 2026)

1. Removed invalid `DEFAULT auth.uid()` from profiles.id
2. Fixed triple-quoted defaults for role and subscription_status
3. Added UNIQUE constraint on (user_id, category) for upserts

---

## Future Considerations

### Tables to Add (Later Phases)

- `seminars` - Master list of video content
- `video_progress` - Track which videos user has watched
- `payments` - Stripe transaction history
- `forum_posts` - Community engagement (Phase 3)

### Potential Optimizations

- Add full-text search on workbook_entries.content
- Add analytics/tracking tables
- Add sharing/collaboration features (shared roadmaps)

---

## Troubleshooting

### User Can't Sign Up

1. Check if trigger `on_auth_user_created` exists
2. Check if RLS policies allow INSERT on profiles
3. Check Supabase Auth settings (email confirmation, etc.)

### User Can't Save Worksheets

1. Check if RLS is enabled on workbook_entries
2. Check if user_id matches auth.uid()
3. Check if UNIQUE constraint is causing conflicts

### Data Not Showing in Dashboard

1. Check if RLS policies allow SELECT
2. Check if user is authenticated (auth.uid() returns value)
3. Check browser console for errors

---

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Triggers Documentation](https://supabase.com/docs/guides/database/postgres/triggers)
