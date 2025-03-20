/*
  # Create users table with first and last name

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `email` (text, unique, not null)
      - `email_verified` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `access_level` (text, check constraint for 'full' or 'limited')

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  access_level text NOT NULL CHECK (access_level IN ('full', 'limited'))
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
