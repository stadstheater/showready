
-- Create shows table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season TEXT NOT NULL DEFAULT '25/26',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  dates TEXT[] DEFAULT '{}',
  start_time TEXT DEFAULT '20:00',
  end_time TEXT DEFAULT '22:00',
  price NUMERIC,
  discount_price NUMERIC,
  genre TEXT CHECK (genre IN ('Cabaret', 'Muziek', 'Theater', 'Musical', 'Jeugd', 'Dans', 'Overig')),
  description_text TEXT,
  text_filename TEXT,
  notes TEXT,
  hero_image_url TEXT,
  hero_image_preview TEXT,
  seo_title TEXT,
  seo_keyword TEXT,
  seo_meta_description TEXT,
  seo_slug TEXT,
  web_text TEXT,
  social_facebook TEXT,
  social_instagram TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create show_images table
CREATE TABLE public.show_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hero', 'scene', 'crop_hero', 'crop_uitlichten', 'crop_narrow', 'crop_slider')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  alt_text TEXT,
  file_size INTEGER,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_images ENABLE ROW LEVEL SECURITY;

-- For now, allow public access (no auth required for internal tool)
CREATE POLICY "Allow all access to shows" ON public.shows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to show_images" ON public.show_images FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for show assets
INSERT INTO storage.buckets (id, name, public) VALUES ('show-assets', 'show-assets', true);

CREATE POLICY "Allow public read show-assets" ON storage.objects FOR SELECT USING (bucket_id = 'show-assets');
CREATE POLICY "Allow public insert show-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'show-assets');
CREATE POLICY "Allow public update show-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'show-assets');
CREATE POLICY "Allow public delete show-assets" ON storage.objects FOR DELETE USING (bucket_id = 'show-assets');
