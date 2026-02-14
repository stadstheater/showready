ALTER TABLE public.shows DROP CONSTRAINT shows_genre_check;

ALTER TABLE public.shows ADD CONSTRAINT shows_genre_check CHECK (
  genre = ANY (ARRAY[
    'Cabaret', 'Muziek', 'Theater', 'Musical', 'Jeugd & Familie',
    'Dans', 'Cultureel initiatief', 'Klassieke Muziek', 'Show',
    'Toneel', 'Theatercollege', 'Muziektheater', 'Overig'
  ])
);