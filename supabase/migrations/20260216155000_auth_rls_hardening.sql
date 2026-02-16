-- 1) Restrict registration to @stadstheater.nl on the server side
CREATE OR REPLACE FUNCTION public.enforce_stadstheater_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR lower(split_part(NEW.email, '@', 2)) <> 'stadstheater.nl' THEN
    RAISE EXCEPTION 'Only @stadstheater.nl accounts are allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_stadstheater_email_domain_on_auth_users ON auth.users;
CREATE TRIGGER enforce_stadstheater_email_domain_on_auth_users
BEFORE INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_stadstheater_email_domain();

-- 2) Add ownership to shows for uid-based write checks
ALTER TABLE public.shows
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

UPDATE public.shows
SET created_by = COALESCE(created_by, auth.uid())
WHERE created_by IS NULL;

ALTER TABLE public.shows
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- For strict ownership writes, require owner on new rows
ALTER TABLE public.shows
  ALTER COLUMN created_by SET NOT NULL;

-- 3) Replace permissive policies with authenticated + ownership checks
DROP POLICY IF EXISTS "Allow all access to shows" ON public.shows;
DROP POLICY IF EXISTS "Allow all access to show_images" ON public.show_images;
DROP POLICY IF EXISTS "Allow all access to settings" ON public.settings;

CREATE POLICY "Authenticated can read shows"
ON public.shows
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert own shows"
ON public.shows
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND created_by = auth.uid()
);

CREATE POLICY "Authenticated can update own shows"
ON public.shows
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND created_by = auth.uid()
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND created_by = auth.uid()
);

CREATE POLICY "Authenticated can delete own shows"
ON public.shows
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND created_by = auth.uid()
);

CREATE POLICY "Authenticated can read show_images"
ON public.show_images
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert images for own shows"
ON public.show_images
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id = show_id
      AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated can update images for own shows"
ON public.show_images
FOR UPDATE
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id = show_id
      AND s.created_by = auth.uid()
  )
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id = show_id
      AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated can delete images for own shows"
ON public.show_images
FOR DELETE
USING (
  auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id = show_id
      AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated can read settings"
ON public.settings
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert settings"
ON public.settings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update settings"
ON public.settings
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete settings"
ON public.settings
FOR DELETE
USING (auth.role() = 'authenticated');

-- 4) Storage hardening: authenticated + ownership for write operations
DROP POLICY IF EXISTS "Allow public insert show-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update show-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete show-assets" ON storage.objects;

CREATE POLICY "Authenticated can insert own show-assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'show-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated can update own show-assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'show-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.created_by = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'show-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.created_by = auth.uid()
  )
);

CREATE POLICY "Authenticated can delete own show-assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'show-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1
    FROM public.shows s
    WHERE s.id::text = split_part(name, '/', 1)
      AND s.created_by = auth.uid()
  )
);
