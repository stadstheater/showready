-- Drop old check constraint and replace with a more flexible one that allows crop_scene_N types
ALTER TABLE public.show_images DROP CONSTRAINT show_images_type_check;

ALTER TABLE public.show_images ADD CONSTRAINT show_images_type_check 
  CHECK (type = ANY (ARRAY['hero', 'scene', 'crop_hero', 'crop_uitlichten', 'crop_narrow', 'crop_slider']) OR type ~ '^crop_scene_\d+$');