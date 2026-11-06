-- =============================================================================
-- Migration: 20261105000003_drop_public_storage_select_policies.sql
-- Description: Remove redundant SELECT policies on public storage buckets
--              (avatars and communities-images) to prevent file enumeration.
-- =============================================================================

-- 1. Drop broad SELECT policy on avatars bucket.
-- Public buckets serve files directly via the public URL without requiring
-- a SELECT policy on storage.objects. Removing this prevents unauthorized clients
-- from listing or enumerating all user avatar files and UUIDs.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 2. Drop broad SELECT policy on communities-images bucket.
-- Images are publicly accessible directly via their CDN URL.
-- Removing this prevents unauthorized enumeration of all community images.
DROP POLICY IF EXISTS "Public read on communities-images" ON storage.objects;

