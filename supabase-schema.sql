-- QueueCut Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinics table
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  specialty TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT DEFAULT '',
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  token_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'skipped')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_patient ON tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_tokens_clinic ON tokens(clinic_id);
CREATE INDEX IF NOT EXISTS idx_tokens_doctor ON tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tokens_status ON tokens(status);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);

-- Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Patients RLS
CREATE POLICY "patients_select_all" ON patients FOR SELECT USING (TRUE);
CREATE POLICY "patients_insert_own" ON patients FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (auth.uid() = id);

-- Clinics RLS
CREATE POLICY "clinics_select_all" ON clinics FOR SELECT USING (TRUE);
CREATE POLICY "clinics_insert_own" ON clinics FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "clinics_update_own" ON clinics FOR UPDATE USING (auth.uid() = id);

-- Doctors RLS
CREATE POLICY "doctors_select_all" ON doctors FOR SELECT USING (TRUE);
CREATE POLICY "doctors_insert_clinic" ON doctors FOR INSERT
  WITH CHECK (auth.uid() = clinic_id);
CREATE POLICY "doctors_update_clinic" ON doctors FOR UPDATE
  USING (auth.uid() = clinic_id);
CREATE POLICY "doctors_delete_clinic" ON doctors FOR DELETE
  USING (auth.uid() = clinic_id);

-- Tokens RLS
CREATE POLICY "tokens_select_patient" ON tokens FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = clinic_id);
CREATE POLICY "tokens_insert_patient" ON tokens FOR INSERT
  WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "tokens_update_clinic" ON tokens FOR UPDATE
  USING (auth.uid() = clinic_id OR auth.uid() = patient_id);

-- Enable Realtime on tokens table
-- In Supabase dashboard: Database > Replication > Add table "tokens"
