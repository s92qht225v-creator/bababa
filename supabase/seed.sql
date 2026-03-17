-- ═══════════════════════════════════════════════════════════
-- bababa (888) — Seed Data
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────
-- LOCATIONS — All 14 regions of Uzbekistan
-- ───────────────────────────────────────────

-- Tashkent City
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Tashkent', 'Tashkent', 'Yunusabad'),
  ('a0000000-0000-0000-0000-000000000002', 'Tashkent', 'Tashkent', 'Mirzo Ulugbek'),
  ('a0000000-0000-0000-0000-000000000003', 'Tashkent', 'Tashkent', 'Chilanzar');

-- Tashkent Region
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'Tashkent Region', 'Chirchiq', NULL),
  ('a0000000-0000-0000-0000-000000000005', 'Tashkent Region', 'Olmaliq', NULL),
  ('a0000000-0000-0000-0000-000000000006', 'Tashkent Region', 'Angren', NULL);

-- Samarkand
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000007', 'Samarkand', 'Samarkand', 'Samarkand City'),
  ('a0000000-0000-0000-0000-000000000008', 'Samarkand', 'Kattaqo''rg''on', NULL),
  ('a0000000-0000-0000-0000-000000000009', 'Samarkand', 'Urgut', NULL);

-- Bukhara
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-00000000000a', 'Bukhara', 'Bukhara', NULL),
  ('a0000000-0000-0000-0000-00000000000b', 'Bukhara', 'Kogon', NULL),
  ('a0000000-0000-0000-0000-00000000000c', 'Bukhara', 'Gijduvan', NULL);

-- Fergana
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-00000000000d', 'Fergana', 'Fergana', NULL),
  ('a0000000-0000-0000-0000-00000000000e', 'Fergana', 'Margilan', NULL),
  ('a0000000-0000-0000-0000-00000000000f', 'Fergana', 'Quvasoy', NULL);

-- Andijan
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'Andijan', 'Andijan', NULL),
  ('a0000000-0000-0000-0000-000000000011', 'Andijan', 'Asaka', NULL),
  ('a0000000-0000-0000-0000-000000000012', 'Andijan', 'Shahrixon', NULL);

-- Namangan
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000013', 'Namangan', 'Namangan', NULL),
  ('a0000000-0000-0000-0000-000000000014', 'Namangan', 'Chortoq', NULL),
  ('a0000000-0000-0000-0000-000000000015', 'Namangan', 'Chust', NULL);

-- Kashkadarya
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000016', 'Kashkadarya', 'Qarshi', NULL),
  ('a0000000-0000-0000-0000-000000000017', 'Kashkadarya', 'Shahrisabz', NULL),
  ('a0000000-0000-0000-0000-000000000018', 'Kashkadarya', 'Kitob', NULL);

-- Surkhandarya
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000019', 'Surkhandarya', 'Termez', NULL),
  ('a0000000-0000-0000-0000-00000000001a', 'Surkhandarya', 'Denov', NULL),
  ('a0000000-0000-0000-0000-00000000001b', 'Surkhandarya', 'Boysun', NULL);

-- Khorezm
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-00000000001c', 'Khorezm', 'Urgench', NULL),
  ('a0000000-0000-0000-0000-00000000001d', 'Khorezm', 'Khiva', NULL),
  ('a0000000-0000-0000-0000-00000000001e', 'Khorezm', 'Shovot', NULL);

-- Navoi
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-00000000001f', 'Navoi', 'Navoi', NULL),
  ('a0000000-0000-0000-0000-000000000020', 'Navoi', 'Zarafshon', NULL),
  ('a0000000-0000-0000-0000-000000000021', 'Navoi', 'Uchquduq', NULL);

-- Jizzakh
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000022', 'Jizzakh', 'Jizzakh', NULL),
  ('a0000000-0000-0000-0000-000000000023', 'Jizzakh', 'Gagarin', NULL),
  ('a0000000-0000-0000-0000-000000000024', 'Jizzakh', 'Dustlik', NULL);

-- Syrdarya
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000025', 'Syrdarya', 'Guliston', NULL),
  ('a0000000-0000-0000-0000-000000000026', 'Syrdarya', 'Shirin', NULL),
  ('a0000000-0000-0000-0000-000000000027', 'Syrdarya', 'Boyovut', NULL);

-- Karakalpakstan
INSERT INTO locations (id, region, city, district) VALUES
  ('a0000000-0000-0000-0000-000000000028', 'Karakalpakstan', 'Nukus', NULL),
  ('a0000000-0000-0000-0000-000000000029', 'Karakalpakstan', 'Kungirot', NULL),
  ('a0000000-0000-0000-0000-00000000002a', 'Karakalpakstan', 'Beruniy', NULL);


-- ───────────────────────────────────────────
-- JOB CATEGORIES (10 categories)
-- ───────────────────────────────────────────
INSERT INTO job_categories (id, slug, name_uz, name_zh, name_ru, icon) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'construction',    'Qurilish',                         '建筑施工',     'Строительство',          'hard-hat'),
  ('b0000000-0000-0000-0000-000000000002', 'mining-energy',   'Kon-metallurgiya va energetika',   '矿业能源',     'Горная промышленность',   'pickaxe'),
  ('b0000000-0000-0000-0000-000000000003', 'it-tech',         'IT va texnologiyalar',             'IT与技术',      'IT и технологии',         'laptop'),
  ('b0000000-0000-0000-0000-000000000004', 'logistics',       'Logistika va transport',           '物流运输',     'Логистика',               'truck'),
  ('b0000000-0000-0000-0000-000000000005', 'manufacturing',   'Ishlab chiqarish',                 '制造业',       'Производство',            'factory'),
  ('b0000000-0000-0000-0000-000000000006', 'finance',         'Moliya va buxgalteriya',           '财务会计',     'Финансы',                 'banknote'),
  ('b0000000-0000-0000-0000-000000000007', 'interpretation',  'Tarjimonlik',                      '口译笔译',     'Перевод',                 'languages'),
  ('b0000000-0000-0000-0000-000000000008', 'administration',  'Boshqaruv',                        '行政管理',     'Администрирование',       'briefcase'),
  ('b0000000-0000-0000-0000-000000000009', 'agriculture',     'Qishloq xo''jaligi',               '农业',         'Сельское хозяйство',      'wheat'),
  ('b0000000-0000-0000-0000-00000000000a', 'other',           'Boshqa',                           '其他',         'Другое',                  'circle-dot');


-- ───────────────────────────────────────────
-- SAMPLE COMPANIES (3)
-- ───────────────────────────────────────────
INSERT INTO companies (id, user_id, slug, name_original, name_zh, name_uz, name_ru, logo_url, industry, description_zh, description_uz, description_ru, website, established_year, employee_count, is_verified) VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    NULL,
    'huaxin-construction-uzbekistan',
    '华信建设乌兹别克斯坦',
    '华信建设乌兹别克斯坦',
    'Huaxin Construction Uzbekistan',
    'Хуасинь Строительство Узбекистан',
    NULL,
    'construction',
    '华信建设是一家专注于乌兹别克斯坦基础设施建设的中国领先建筑企业，业务涵盖道路、桥梁和商业建筑。',
    'Huaxin Construction — O''zbekistondagi infratuzilma qurilishiga ixtisoslashgan yetakchi xitoy qurilish kompaniyasi.',
    'Хуасинь Строительство — ведущая китайская строительная компания, специализирующаяся на инфраструктурном строительстве в Узбекистане.',
    'https://huaxin-construction.example.com',
    2015,
    '500-1000',
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    NULL,
    'zhongtai-mining-group',
    '中泰矿业集团',
    '中泰矿业集团',
    'Zhongtai Mining Group',
    'Чжунтай Горнодобывающая Группа',
    NULL,
    'mining-energy',
    '中泰矿业集团是在乌兹别克斯坦从事金矿和铜矿开采的大型矿业企业，拥有先进的采矿技术和设备。',
    'Zhongtai Mining Group — O''zbekistonda oltin va mis qazib olish bilan shug''ullanuvchi yirik konchilik kompaniyasi.',
    'Чжунтай Горнодобывающая Группа — крупная горнодобывающая компания, занимающаяся добычей золота и меди в Узбекистане.',
    'https://zhongtai-mining.example.com',
    2018,
    '200-500',
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000003',
    NULL,
    'daxin-technology-tashkent',
    '达信科技塔什干',
    '达信科技塔什干',
    'Daxin Technology Tashkent',
    'Дасинь Технологии Ташкент',
    NULL,
    'it-tech',
    '达信科技是一家在塔什干运营的中国IT公司，专注于软件开发、电信基础设施和数字化解决方案。',
    'Daxin Technology — Toshkentda faoliyat yurituvchi xitoy IT kompaniyasi, dasturiy ta''minot ishlab chiqish va raqamli yechimlar sohasida.',
    'Дасинь Технологии — китайская IT-компания в Ташкенте, специализирующаяся на разработке ПО и цифровых решениях.',
    'https://daxin-tech.example.com',
    2020,
    '50-200',
    true
  );


-- ───────────────────────────────────────────
-- SAMPLE JOBS (5)
-- ───────────────────────────────────────────
INSERT INTO jobs (id, company_id, category_id, location_id, slug, title_original, title_zh, title_uz, title_ru, description_original, description_zh, description_uz, description_ru, source_language, salary_min, salary_max, salary_currency, hsk_required, experience_years, employment_type, workers_needed, benefits, deadline, status) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'civil-engineer-huaxin-tashkent',
    '土木工程师',
    '土木工程师',
    'Qurilish muhandisi',
    'Инженер-строитель',
    '华信建设招聘经验丰富的土木工程师，负责塔什干商业建筑项目的设计与监督。要求具备混凝土结构和项目管理经验。',
    '华信建设招聘经验丰富的土木工程师，负责塔什干商业建筑项目的设计与监督。要求具备混凝土结构和项目管理经验。',
    'Huaxin Construction Toshkentdagi tijorat qurilish loyihalarini loyihalash va nazorat qilish uchun tajribali qurilish muhandisini qidirmoqda.',
    'Хуасинь Строительство ищет опытного инженера-строителя для проектирования и надзора за коммерческими строительными проектами в Ташкенте.',
    'zh',
    1200, 2000, 'USD', 2, 3, 'full_time', 2,
    ARRAY['Бесплатное жильё', 'Медицинская страховка', 'Авиабилеты'],
    '2026-06-30', 'active'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-00000000001f',
    'mining-technician-zhongtai-navoi',
    '矿山技术员',
    '矿山技术员',
    'Konchilik texnigi',
    'Горный техник',
    '中泰矿业集团纳沃伊金矿基地招聘矿山技术员，负责矿山设备维护和采矿作业的技术支持。',
    '中泰矿业集团纳沃伊金矿基地招聘矿山技术员，负责矿山设备维护和采矿作业的技术支持。',
    'Zhongtai Mining Group Navoiydagi oltin kon bazasi uchun konchilik texnigini qidirmoqda.',
    'Чжунтай Горнодобывающая Группа ищет горного техника для золоторудной базы в Навои.',
    'zh',
    800, 1400, 'USD', 1, 2, 'full_time', 3,
    ARRAY['Бесплатное проживание', 'Питание', 'Транспорт'],
    '2026-07-15', 'active'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'frontend-developer-daxin-tashkent',
    '前端开发工程师',
    '前端开发工程师',
    'Frontend dasturchi',
    'Фронтенд-разработчик',
    '达信科技塔什干招聘前端开发工程师，参与电信管理系统的开发。要求精通React和TypeScript。',
    '达信科技塔什干招聘前端开发工程师，参与电信管理系统的开发。要求精通React和TypeScript。',
    'Daxin Technology telekommunikatsiya boshqaruv tizimlarini ishlab chiqish uchun frontend dasturchini qidirmoqda.',
    'Дасинь Технологии ищет фронтенд-разработчика для разработки телекоммуникационных систем управления.',
    'zh',
    1500, 2500, 'USD', 0, 2, 'full_time', 1,
    ARRAY['Гибкий график', 'Обучение', 'Бонусы'],
    '2026-05-30', 'active'
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000007',
    'chinese-uzbek-interpreter-huaxin-samarkand',
    '中乌翻译',
    '中乌翻译',
    'Xitoy-o''zbek tarjimon',
    'Китайско-узбекский переводчик',
    '华信建设撒马尔罕项目部招聘中乌翻译，负责施工现场的口译和书面翻译工作。要求HSK4级以上。',
    '华信建设撒马尔罕项目部招聘中乌翻译，负责施工现场的口译和书面翻译工作。要求HSK4级以上。',
    'Huaxin Construction Samarqand loyihasi uchun xitoy-o''zbek tarjimonni qidirmoqda. HSK 4-daraja talab qilinadi.',
    'Хуасинь Строительство ищет китайско-узбекского переводчика для проекта в Самарканде. Требуется HSK 4.',
    'zh',
    1000, 1800, 'USD', 4, 1, 'full_time', 2,
    ARRAY['Бесплатное жильё', 'Питание'],
    '2026-06-15', 'active'
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'logistics-coordinator-zhongtai-tashkent',
    '物流协调员',
    '物流协调员',
    'Logistika koordinatori',
    'Координатор логистики',
    '中泰矿业集团塔什干总部招聘物流协调员，负责矿业设备和材料的进出口物流协调。',
    '中泰矿业集团塔什干总部招聘物流协调员，负责矿业设备和材料的进出口物流协调。',
    'Zhongtai Mining Group Toshkent bosh ofisi uchun logistika koordinatorini qidirmoqda.',
    'Чжунтай ищет координатора логистики в головном офисе в Ташкенте для координации импорта и экспорта горного оборудования.',
    'zh',
    900, 1500, 'USD', 3, 2, 'contract', 1,
    ARRAY['Бонусы', 'Медицинская страховка'],
    '2026-08-01', 'active'
  );


-- ───────────────────────────────────────────
-- SAMPLE WORKER PROFILES (5)
-- Note: user_id is NULL because these are seed-data
-- placeholders. In production, each worker will be
-- linked to a real auth.users row.
-- ───────────────────────────────────────────
INSERT INTO worker_profiles (id, user_id, slug, age, gender, location_id, profession, category_id, hsk_level, languages, experience_years, skills, expected_salary_min, expected_salary_max, salary_currency, availability_status, bio_original, bio_zh, bio_uz, bio_ru, source_language, is_public, is_verified) VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    NULL,
    'alisher-nazarov-interpreter-tashkent',
    28, 'male',
    'a0000000-0000-0000-0000-000000000001',
    'Interpreter',
    'b0000000-0000-0000-0000-000000000007',
    5,
    ARRAY['uz', 'zh', 'ru', 'en'],
    4,
    ARRAY['口译', '笔译', '商务谈判', '法律翻译'],
    1200, 2000, 'USD',
    'available',
    'Men Alisher Nazarov, 4 yillik tajribaga ega professional xitoy-o''zbek tarjimonman. HSK 5 darajasiga egaman va turli sohalarda tarjimonlik qilganman.',
    '我是阿里舍尔·纳扎罗夫，拥有4年经验的专业中乌翻译。我持有HSK5级证书，在多个行业提供过翻译服务。',
    'Men Alisher Nazarov, 4 yillik tajribaga ega professional xitoy-o''zbek tarjimonman. HSK 5 darajasiga egaman va turli sohalarda tarjimonlik qilganman.',
    'Я Алишер Назаров, профессиональный китайско-узбекский переводчик с 4-летним опытом. Имею сертификат HSK 5 и работал в различных отраслях.',
    'uz',
    true, true
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    NULL,
    'dilnoza-karimova-accountant-tashkent',
    32, 'female',
    'a0000000-0000-0000-0000-000000000001',
    'Accountant',
    'b0000000-0000-0000-0000-000000000006',
    3,
    ARRAY['uz', 'zh', 'ru'],
    6,
    ARRAY['1C бухгалтерия', 'Налоговый учёт', 'Финансовая отчётность', 'Excel'],
    800, 1400, 'USD',
    'available',
    'Dilnoza Karimova, 6 yillik buxgalteriya tajribasiga ega mutaxassis. Xitoy kompaniyalari bilan ishlash tajribasiga egaman.',
    '迪尔诺扎·卡里莫娃，拥有6年会计经验的专业人员。有与中国公司合作的经验。',
    'Dilnoza Karimova, 6 yillik buxgalteriya tajribasiga ega mutaxassis. Xitoy kompaniyalari bilan ishlash tajribasiga egaman.',
    'Дильноза Каримова, специалист с 6-летним опытом в бухгалтерии. Имею опыт работы с китайскими компаниями.',
    'uz',
    true, true
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    NULL,
    'bobur-toshmatov-civil-engineer-samarkand',
    35, 'male',
    'a0000000-0000-0000-0000-000000000007',
    'Civil Engineer',
    'b0000000-0000-0000-0000-000000000001',
    2,
    ARRAY['uz', 'zh', 'ru'],
    8,
    ARRAY['AutoCAD', 'Бетонные конструкции', 'Управление проектами', 'Контроль качества'],
    1000, 1800, 'USD',
    'available',
    'Bobur Toshmatov, 8 yillik qurilish muhandislik tajribasiga ega. Samarqanddagi yirik qurilish loyihalarida ishlagan.',
    '鲍布尔·托什马托夫，拥有8年土木工程经验。曾参与撒马尔罕的大型建设项目。',
    'Bobur Toshmatov, 8 yillik qurilish muhandislik tajribasiga ega. Samarqanddagi yirik qurilish loyihalarida ishlagan.',
    'Бобур Тошматов, инженер-строитель с 8-летним опытом. Работал на крупных строительных проектах в Самарканде.',
    'uz',
    true, false
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    NULL,
    'jasur-rakhimov-driver-tashkent',
    40, 'male',
    'a0000000-0000-0000-0000-000000000002',
    'Heavy Equipment Operator',
    'b0000000-0000-0000-0000-000000000001',
    1,
    ARRAY['uz', 'ru'],
    12,
    ARRAY['Экскаватор', 'Бульдозер', 'Кран', 'Категория CE'],
    700, 1200, 'USD',
    'available',
    'Jasur Rakhimov, 12 yillik og''ir texnika operatori tajribasiga ega. Ekskavator, buldozer va kranlarda ishlash tajribasiga egaman.',
    '贾苏尔·拉希莫夫，拥有12年重型设备操作经验。熟练操作挖掘机、推土机和起重机。',
    'Jasur Rakhimov, 12 yillik og''ir texnika operatori tajribasiga ega. Ekskavator, buldozer va kranlarda ishlash tajribasiga egaman.',
    'Джасур Рахимов, оператор тяжёлой техники с 12-летним опытом. Опыт работы на экскаваторах, бульдозерах и кранах.',
    'uz',
    true, true
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    NULL,
    'sevara-umarova-developer-tashkent',
    26, 'female',
    'a0000000-0000-0000-0000-000000000001',
    'Full-Stack Developer',
    'b0000000-0000-0000-0000-000000000003',
    0,
    ARRAY['uz', 'ru', 'en'],
    3,
    ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Python'],
    1500, 2500, 'USD',
    'available',
    'Sevara Umarova, 3 yillik full-stack dasturlash tajribasiga ega. React, Node.js va PostgreSQL bilan ishlashda tajribali.',
    '塞瓦拉·乌马罗娃，拥有3年全栈开发经验。精通React、Node.js和PostgreSQL。',
    'Sevara Umarova, 3 yillik full-stack dasturlash tajribasiga ega. React, Node.js va PostgreSQL bilan ishlashda tajribali.',
    'Севара Умарова, фулстек-разработчик с 3-летним опытом. Опыт работы с React, Node.js и PostgreSQL.',
    'uz',
    true, false
  );
