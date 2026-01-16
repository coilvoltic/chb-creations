-- =========================================
-- Storage Policies for CHB Creation Products bucket
-- =========================================
-- Configure access policies for product images storage
-- Bucket name: "CHB Creation Products"
-- Structure: {subcategory}/{timestamp}-{random}.{ext}

-- =========================================
-- 1. Public Access for Reading/Downloading Images
-- =========================================
-- Allow anyone (including anonymous users) to view product images
-- This is necessary for displaying images on the public website

CREATE POLICY "Public Access - Select/Download Images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'CHB Creation Products');

-- =========================================
-- 2. Authenticated Users Can Upload Images
-- =========================================
-- Only authenticated admin users can upload new product images
-- This restricts upload access to logged-in admin users only

CREATE POLICY "Authenticated Users - Upload Images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'CHB Creation Products');

-- =========================================
-- 3. Authenticated Users Can Update Images
-- =========================================
-- Only authenticated admin users can update existing images
-- Useful for replacing or modifying product images

CREATE POLICY "Authenticated Users - Update Images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'CHB Creation Products')
WITH CHECK (bucket_id = 'CHB Creation Products');

-- =========================================
-- 4. Authenticated Users Can Delete Images
-- =========================================
-- Only authenticated admin users can delete product images
-- Important for managing storage and removing obsolete images

CREATE POLICY "Authenticated Users - Delete Images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'CHB Creation Products');

-- =========================================
-- Notes:
-- =========================================
-- - The bucket "CHB Creation Products" must be created manually in Supabase Dashboard
-- - Bucket should be set as PUBLIC (allows public access via signed URLs)
-- - Images are organized in subfolders by subcategory (e.g., art-de-table/, deco-et-accessoires/)
-- - Signed URLs have 10-year validity (315360000 seconds)
-- - Only authenticated users (admins) can upload/modify/delete images
-- - Anonymous users can only view/download images (for public website display)
