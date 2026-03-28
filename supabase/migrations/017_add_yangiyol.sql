-- Add Yangiyo'l city to Tashkent Region
INSERT INTO locations (id, city, region) VALUES
  (gen_random_uuid(), 'Yangiyo''l', 'Tashkent Region')
ON CONFLICT DO NOTHING;

-- Update cocofood job location from "Other" to "Yangiyo'l"
UPDATE jobs
SET location_id = (SELECT id FROM locations WHERE city = 'Yangiyo''l' AND region = 'Tashkent Region' LIMIT 1)
WHERE company_id = (SELECT id FROM companies WHERE name_original ILIKE '%cocofood%' LIMIT 1);
