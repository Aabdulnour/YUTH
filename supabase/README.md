# Supabase Setup

## Environment variables
Add these to your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## Database setup
1. Open Supabase SQL Editor.
2. Run `supabase/schema.sql`.
3. In **Authentication > Providers > Email**, enable Email/Password.
4. For hackathon flow, disable email confirmation if you want immediate sign-in after signup.
5. Ensure RLS is enabled on both tables and policies are created (the schema script does this).

## What is persisted
- `user_profiles`: one profile row per user.
- `user_actions`: action completion state per user/action pair.

## App flow
- Public: `/` and `/auth`.
- Private (auth required): `/onboarding`, `/dashboard`, `/ask-ai`, `/profile`.

## Expected persistence behavior
- New authenticated user with no `user_profiles` row is routed to onboarding.
- No `user_actions` rows is a valid empty state and returns no completion entries.
- Profile and action writes upsert cleanly by user.

## Troubleshooting
- If tables are missing, run `supabase/schema.sql` again.
- If queries fail with permissions/RLS errors, verify you ran the policies in `schema.sql`.
- Private pages rely on Supabase auth session; if you are logged out you will be redirected to `/auth?mode=login`.
