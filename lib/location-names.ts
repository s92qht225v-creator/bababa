/**
 * Localized city & region names for Uzbekistan.
 * Keys are the English names stored in the `locations` table.
 */

type LocaleNames = { uz: string; zh: string; ru: string }

const REGION_NAMES: Record<string, LocaleNames> = {
  'Tashkent':         { uz: 'Toshkent',          zh: '塔什干',        ru: 'Ташкент' },
  'Tashkent Region':  { uz: 'Toshkent viloyati',  zh: '塔什干州',      ru: 'Ташкентская область' },
  'Samarkand':        { uz: 'Samarqand',          zh: '撒马尔罕',      ru: 'Самарканд' },
  'Bukhara':          { uz: 'Buxoro',             zh: '布哈拉',        ru: 'Бухара' },
  'Fergana':          { uz: "Farg'ona",           zh: '费尔干纳',      ru: 'Фергана' },
  'Andijan':          { uz: 'Andijon',            zh: '安集延',        ru: 'Андижан' },
  'Namangan':         { uz: 'Namangan',           zh: '纳曼干',        ru: 'Наманган' },
  'Kashkadarya':      { uz: 'Qashqadaryo',       zh: '卡什卡达里亚',   ru: 'Кашкадарья' },
  'Surkhandarya':     { uz: 'Surxondaryo',        zh: '苏尔汉河',      ru: 'Сурхандарья' },
  'Khorezm':          { uz: 'Xorazm',            zh: '花拉子模',      ru: 'Хорезм' },
  'Navoi':            { uz: 'Navoiy',             zh: '纳沃伊',        ru: 'Навои' },
  'Jizzakh':          { uz: 'Jizzax',             zh: '吉扎克',        ru: 'Джизак' },
  'Syrdarya':         { uz: 'Sirdaryo',           zh: '锡尔河',        ru: 'Сырдарья' },
  'Karakalpakstan':   { uz: "Qoraqalpog'iston",  zh: '卡拉卡尔帕克斯坦', ru: 'Каракалпакстан' },
}

const CITY_NAMES: Record<string, LocaleNames> = {
  // Tashkent
  'Tashkent':       { uz: 'Toshkent',       zh: '塔什干',     ru: 'Ташкент' },
  // Tashkent Region
  'Chirchiq':       { uz: 'Chirchiq',       zh: '奇尔奇克',    ru: 'Чирчик' },
  'Olmaliq':        { uz: 'Olmaliq',        zh: '阿尔马利克',   ru: 'Алмалык' },
  'Angren':         { uz: 'Angren',         zh: '安格连',      ru: 'Ангрен' },
  // Samarkand
  'Samarkand':      { uz: 'Samarqand',      zh: '撒马尔罕',    ru: 'Самарканд' },
  "Kattaqo'rg'on":  { uz: "Kattaqo'rg'on",  zh: '卡塔库尔干',   ru: 'Каттакурган' },
  'Urgut':          { uz: "Urgut",          zh: '乌尔古特',    ru: 'Ургут' },
  // Bukhara
  'Bukhara':        { uz: 'Buxoro',         zh: '布哈拉',      ru: 'Бухара' },
  'Kogon':          { uz: 'Kogon',          zh: '科冈',        ru: 'Коган' },
  'Gijduvan':       { uz: 'G\'ijduvon',     zh: '吉日杜万',    ru: 'Гиждуван' },
  // Fergana
  'Fergana':        { uz: "Farg'ona",       zh: '费尔干纳',    ru: 'Фергана' },
  'Margilan':       { uz: "Marg'ilon",      zh: '马尔吉兰',    ru: 'Маргилан' },
  'Quvasoy':        { uz: 'Quvasoy',        zh: '库瓦萨伊',    ru: 'Кувасай' },
  // Andijan
  'Andijan':        { uz: 'Andijon',        zh: '安集延',      ru: 'Андижан' },
  'Asaka':          { uz: 'Asaka',          zh: '阿萨卡',      ru: 'Асака' },
  'Shahrixon':      { uz: 'Shahrixon',      zh: '沙赫里汉',    ru: 'Шахрихан' },
  // Namangan
  'Namangan':       { uz: 'Namangan',       zh: '纳曼干',      ru: 'Наманган' },
  'Chortoq':        { uz: "Chortoq",        zh: '乔尔托克',    ru: 'Чартак' },
  'Chust':          { uz: 'Chust',          zh: '楚斯特',      ru: 'Чуст' },
  // Kashkadarya
  'Qarshi':         { uz: 'Qarshi',         zh: '卡尔希',      ru: 'Карши' },
  'Shahrisabz':     { uz: 'Shahrisabz',     zh: '沙赫里萨布兹', ru: 'Шахрисабз' },
  'Kitob':          { uz: 'Kitob',          zh: '基塔布',      ru: 'Китаб' },
  // Surkhandarya
  'Termez':         { uz: 'Termiz',         zh: '铁尔梅兹',    ru: 'Термез' },
  'Denov':          { uz: 'Denov',          zh: '杰纳乌',      ru: 'Денау' },
  'Boysun':         { uz: 'Boysun',         zh: '博伊松',      ru: 'Байсун' },
  // Khorezm
  'Urgench':        { uz: 'Urganch',        zh: '乌尔根奇',    ru: 'Ургенч' },
  'Khiva':          { uz: 'Xiva',           zh: '希瓦',        ru: 'Хива' },
  'Shovot':         { uz: 'Shovot',         zh: '绍沃特',      ru: 'Шават' },
  // Navoi
  'Navoi':          { uz: 'Navoiy',         zh: '纳沃伊',      ru: 'Навои' },
  'Zarafshon':      { uz: 'Zarafshon',      zh: '扎拉夫尚',    ru: 'Зарафшан' },
  'Uchquduq':       { uz: 'Uchquduq',       zh: '乌奇库杜克',   ru: 'Учкудук' },
  // Jizzakh
  'Jizzakh':        { uz: 'Jizzax',         zh: '吉扎克',      ru: 'Джизак' },
  'Gagarin':        { uz: 'Gagarin',        zh: '加加林',      ru: 'Гагарин' },
  'Dustlik':        { uz: 'Do\'stlik',       zh: '杜斯特里克',   ru: 'Дустлик' },
  // Syrdarya
  'Guliston':       { uz: 'Guliston',       zh: '古利斯坦',    ru: 'Гулистан' },
  'Shirin':         { uz: 'Shirin',         zh: '希林',        ru: 'Ширин' },
  'Boyovut':        { uz: 'Boyovut',        zh: '博伊奥武特',   ru: 'Бояут' },
  // Karakalpakstan
  'Nukus':          { uz: 'Nukus',          zh: '努库斯',      ru: 'Нукус' },
  'Kungirot':       { uz: "Qo'ng'irot",     zh: '昆格拉特',    ru: 'Кунград' },
  'Beruniy':        { uz: 'Beruniy',        zh: '别鲁尼',      ru: 'Беруни' },
  // New cities
  'Xonobod':        { uz: 'Xonobod',        zh: '霍纳巴德',    ru: 'Ханабад' },
  'Marhamat':       { uz: 'Marhamat',       zh: '马尔哈马特',   ru: 'Мархамат' },
  'Olot':           { uz: 'Olot',           zh: '阿洛特',      ru: 'Алат' },
  'Romitan':        { uz: 'Romitan',        zh: '罗米坦',      ru: 'Ромитан' },
  "Qo'qon":        { uz: "Qo'qon",        zh: '浩罕',        ru: 'Коканд' },
  'Rishton':        { uz: 'Rishton',        zh: '里什坦',      ru: 'Риштан' },
  'Beshariq':       { uz: 'Beshariq',       zh: '贝沙里克',    ru: 'Бешарык' },
  "Do'stlik":       { uz: "Do'stlik",       zh: '杜斯特里克',   ru: 'Дустлик' },
  "Xo'jayli":       { uz: "Xo'jayli",       zh: '霍贾伊利',    ru: 'Ходжейли' },
  'Taxiatosh':      { uz: 'Taxiatosh',      zh: '塔希亚塔什',   ru: 'Тахиаташ' },
  'Muborak':        { uz: 'Muborak',        zh: '穆巴拉克',    ru: 'Мубарек' },
  "Yakkabog'":      { uz: "Yakkabog'",      zh: '亚卡巴格',    ru: 'Яккабаг' },
  "G'uzor":         { uz: "G'uzor",         zh: '古扎尔',      ru: 'Гузар' },
  'Hazorasp':       { uz: 'Hazorasp',       zh: '哈扎拉斯普',   ru: 'Хазарасп' },
  'Pop':            { uz: 'Pop',            zh: '帕普',        ru: 'Пап' },
  "Uchqo'rg'on":    { uz: "Uchqo'rg'on",    zh: '乌奇库尔干',   ru: 'Учкурган' },
  'Konimex':        { uz: 'Konimex',        zh: '科尼梅克斯',   ru: 'Конимех' },
  "Bulung'ur":      { uz: "Bulung'ur",      zh: '布隆古尔',    ru: 'Булунгур' },
  'Ishtixon':       { uz: 'Ishtixon',       zh: '伊什蒂汉',    ru: 'Иштихан' },
  'Sherobod':       { uz: 'Sherobod',       zh: '谢拉巴德',    ru: 'Шерабад' },
  "Sho'rchi":       { uz: "Sho'rchi",       zh: '绍尔奇',      ru: 'Шурчи' },
  'Yangiyer':       { uz: 'Yangiyer',       zh: '扬吉耶尔',    ru: 'Янгиер' },
  'Bekobod':        { uz: 'Bekobod',        zh: '别卡巴德',    ru: 'Бекабад' },
  'Ohangaron':      { uz: 'Ohangaron',      zh: '阿汉加兰',    ru: 'Ахангаран' },
  'Nurafshon':      { uz: 'Nurafshon',      zh: '努拉夫尚',    ru: 'Нурафшон' },
  // Fallback
  'Other':          { uz: 'Boshqa',         zh: '其他',        ru: 'Другое' },
}

type Locale = 'uz' | 'zh' | 'ru'

/** Get localized city name. Falls back to the English name. */
export function localizeCity(city: string, locale: string): string {
  const l = locale as Locale
  return CITY_NAMES[city]?.[l] ?? city
}

/** Get localized region name. Falls back to the English name. */
export function localizeRegion(region: string, locale: string): string {
  const l = locale as Locale
  return REGION_NAMES[region]?.[l] ?? region
}

/** Get localized "City, Region" string. */
export function localizeLocation(
  city: string | null | undefined,
  region: string | null | undefined,
  locale: string,
): string {
  const parts: string[] = []
  if (city) parts.push(localizeCity(city, locale))
  if (region && region !== city) parts.push(localizeRegion(region, locale))
  return parts.join(', ') || ''
}
