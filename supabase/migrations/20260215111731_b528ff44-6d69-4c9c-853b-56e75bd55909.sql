
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default values
INSERT INTO public.settings (key, value) VALUES
  ('default_season', '"auto"'),
  ('ai_model', '"google/gemini-3-flash-preview"'),
  ('ai_max_words', '150'),
  ('default_start_time', '"20:00"'),
  ('default_end_time', '"22:00"'),
  ('genres', '["Cabaret","Muziek","Theater","Musical","Jeugd & Familie","Dans","Cultureel initiatief","Klassieke Muziek","Show","Toneel","Theatercollege","Muziektheater","Overig"]');
