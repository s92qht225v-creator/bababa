-- Add trilingual profession columns
ALTER TABLE worker_profiles
  ADD COLUMN IF NOT EXISTS profession_uz text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profession_zh text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profession_ru text DEFAULT '';

-- Backfill existing seed data with translations
UPDATE worker_profiles SET
  profession_uz = CASE profession
    WHEN 'Interpreter' THEN 'Tarjimon'
    WHEN 'Accountant' THEN 'Buxgalter'
    WHEN 'Civil Engineer' THEN 'Qurilish muhandisi'
    WHEN 'Heavy Equipment Operator' THEN 'Og''ir texnika operatori'
    WHEN 'Full-Stack Developer' THEN 'Full-Stack dasturchi'
    ELSE profession
  END,
  profession_zh = CASE profession
    WHEN 'Interpreter' THEN '口译员'
    WHEN 'Accountant' THEN '会计'
    WHEN 'Civil Engineer' THEN '土木工程师'
    WHEN 'Heavy Equipment Operator' THEN '重型设备操作员'
    WHEN 'Full-Stack Developer' THEN '全栈开发工程师'
    ELSE profession
  END,
  profession_ru = CASE profession
    WHEN 'Interpreter' THEN 'Переводчик'
    WHEN 'Accountant' THEN 'Бухгалтер'
    WHEN 'Civil Engineer' THEN 'Инженер-строитель'
    WHEN 'Heavy Equipment Operator' THEN 'Оператор тяжёлой техники'
    WHEN 'Full-Stack Developer' THEN 'Full-Stack разработчик'
    ELSE profession
  END;
