-- Remove phone number from cocofood job descriptions
UPDATE jobs SET
  description_uz = REPLACE(description_uz, ' Telefon: 993785511', ''),
  description_zh = REPLACE(description_zh, '，电话:993785511', ''),
  description_ru = REPLACE(description_ru, ', телефон: 993785511.', '.')
WHERE id = 'd3cb4dee-46da-4e88-8cce-cbdf9831fd90';
