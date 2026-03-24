-- Fix existing district spellings to correct Uzbek
UPDATE locations SET district = 'Yunusobod' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE locations SET district = 'Mirzo Ulug''bek' WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE locations SET district = 'Chilonzor' WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- Add the 9 missing Tashkent districts
INSERT INTO locations (id, city, region, district) VALUES
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Bektemir'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Mirobod'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Olmazor'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Sergeli'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Uchtepa'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Yakkasaroy'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Yangihayot'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Yashnobod'),
  (gen_random_uuid(), 'Tashkent', 'Tashkent', 'Shayxontohur');
