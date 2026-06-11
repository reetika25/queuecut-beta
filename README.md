# QueueCut

Skip the waiting room. Book clinic tokens, track your queue in real time.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Supabase** (Auth, Database, Realtime)

## Quick Setup

### 1. Create a Supabase project
Go to https://supabase.com and create a new project.

### 2. Run the schema
In Supabase Dashboard → SQL Editor, paste and run `supabase-schema.sql`.

### 3. Enable Realtime
Dashboard → Database → Replication → enable `tokens` table.

### 4. Set environment variables
```
cp .env.local.example .env.local
```
Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from Dashboard → Settings → API.

### 5. Install and run
```
npm install
npm run dev
```

## App Structure

| Route | Description |
|-------|-------------|
| / | Landing page |
| /auth/patient/login | Patient login |
| /auth/patient/signup | Patient signup |
| /auth/clinic/login | Clinic login |
| /auth/clinic/signup | Clinic registration |
| /patient | Browse clinics |
| /patient/clinic/:id | View doctors + book token |
| /patient/token | Live token + queue position |
| /clinic | Queue dashboard (realtime) |
| /clinic/doctors | Manage doctors |

## Database Schema

| Table | Key fields |
|-------|------------|
| patients | id, name, email, phone |
| clinics | id, name, email, address, specialty |
| doctors | id, clinic_id, name, specialty, available |
| tokens | id, patient_id, clinic_id, doctor_id, token_number, status |

Token lifecycle: `waiting` → `active` → `completed` (or `skipped`)

## Deploy
Connect repo to Vercel, add env vars, deploy.
