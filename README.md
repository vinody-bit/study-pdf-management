# NovaStudy

A futuristic study portal with secure admin-only PDF management powered by Supabase.

## Features

- Cinematic intro and futuristic dark UI
- Responsive public library with search, filter, and sort
- Dedicated PDF viewer using real uploaded PDFs
- Admin-only authentication and authorization
- First admin setup flow with secure role assignment
- PDF upload, edit, delete, and storage integration
- Supabase Storage bucket + database metadata model
- RLS security rules for public reads and admin-only writes

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth
- Supabase Storage
- Supabase PostgreSQL database

## Local setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Install dependencies:
   `npm install`
4. Run development server:
   `npm run dev`

## Required Supabase configuration

### Authentication

Go to:
`Authentication -> Providers -> Email`

Disable:
`Confirm email`

This is required for the initial administrator setup to work immediately without email verification blocking the first admin login.

If email confirmation stays enabled, the app will show a message instructing the admin to verify the account. However, for this private study website the recommended configuration is to disable email confirmation for the initial setup.

### Storage bucket

Create a Supabase storage bucket named:
`study-pdfs`

Set it to public or use signed URLs. The application uses signed URLs for secure viewing/downloading.

### Database setup

Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.

This creates:
- `profiles` table
- `study_pdfs` table
- row level security policies
- trigger for updating `updated_at`

## Admin setup rules

- If no admin exists, `/admin/setup` is allowed.
- If an admin exists, `/admin/setup` redirects to `/admin/login`.
- Only the first admin account can be created through the setup route.
- The app never exposes a service role key in frontend code.

## Production note

This app expects a real Supabase project to be connected. Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the website will not be able to authenticate or load PDFs from storage.
