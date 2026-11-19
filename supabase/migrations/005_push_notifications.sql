-- File: supabase/migrations/005_push_notifications.sql

-- Add push_token column to profiles table for remote notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
