-- Add missing notable cities across Uzbekistan and "Other" fallback per region
INSERT INTO locations (id, city, region) VALUES
  -- Andijan
  (gen_random_uuid(), 'Xonobod', 'Andijan'),
  (gen_random_uuid(), 'Marhamat', 'Andijan'),
  -- Bukhara
  (gen_random_uuid(), 'Olot', 'Bukhara'),
  (gen_random_uuid(), 'Romitan', 'Bukhara'),
  -- Fergana
  (gen_random_uuid(), 'Qo''qon', 'Fergana'),
  (gen_random_uuid(), 'Rishton', 'Fergana'),
  (gen_random_uuid(), 'Beshariq', 'Fergana'),
  -- Jizzakh
  (gen_random_uuid(), 'Do''stlik', 'Jizzakh'),
  -- Karakalpakstan
  (gen_random_uuid(), 'Xo''jayli', 'Karakalpakstan'),
  (gen_random_uuid(), 'Taxiatosh', 'Karakalpakstan'),
  -- Kashkadarya
  (gen_random_uuid(), 'Muborak', 'Kashkadarya'),
  (gen_random_uuid(), 'Yakkabog''', 'Kashkadarya'),
  (gen_random_uuid(), 'G''uzor', 'Kashkadarya'),
  -- Khorezm
  (gen_random_uuid(), 'Hazorasp', 'Khorezm'),
  -- Namangan
  (gen_random_uuid(), 'Pop', 'Namangan'),
  (gen_random_uuid(), 'Uchqo''rg''on', 'Namangan'),
  -- Navoi
  (gen_random_uuid(), 'Konimex', 'Navoi'),
  -- Samarkand
  (gen_random_uuid(), 'Bulung''ur', 'Samarkand'),
  (gen_random_uuid(), 'Ishtixon', 'Samarkand'),
  -- Surkhandarya
  (gen_random_uuid(), 'Sherobod', 'Surkhandarya'),
  (gen_random_uuid(), 'Sho''rchi', 'Surkhandarya'),
  -- Syrdarya
  (gen_random_uuid(), 'Yangiyer', 'Syrdarya'),
  -- Tashkent Region
  (gen_random_uuid(), 'Bekobod', 'Tashkent Region'),
  (gen_random_uuid(), 'Ohangaron', 'Tashkent Region'),
  (gen_random_uuid(), 'Nurafshon', 'Tashkent Region'),
  -- "Other" fallback per region
  (gen_random_uuid(), 'Other', 'Andijan'),
  (gen_random_uuid(), 'Other', 'Bukhara'),
  (gen_random_uuid(), 'Other', 'Fergana'),
  (gen_random_uuid(), 'Other', 'Jizzakh'),
  (gen_random_uuid(), 'Other', 'Karakalpakstan'),
  (gen_random_uuid(), 'Other', 'Kashkadarya'),
  (gen_random_uuid(), 'Other', 'Khorezm'),
  (gen_random_uuid(), 'Other', 'Namangan'),
  (gen_random_uuid(), 'Other', 'Navoi'),
  (gen_random_uuid(), 'Other', 'Samarkand'),
  (gen_random_uuid(), 'Other', 'Surkhandarya'),
  (gen_random_uuid(), 'Other', 'Syrdarya'),
  (gen_random_uuid(), 'Other', 'Tashkent'),
  (gen_random_uuid(), 'Other', 'Tashkent Region')
ON CONFLICT DO NOTHING;
