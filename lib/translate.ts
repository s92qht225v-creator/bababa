import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import type { Locale, TranslatedJob, TranslatedBio } from '@/types'
import crypto from 'crypto'

const LANG_NAMES: Record<Locale, string> = {
  uz: 'Uzbek',
  zh: 'Chinese',
  ru: 'Russian',
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    console.error('[translate] OPENAI_API_KEY is not set!')
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey: key })
}

async function chatTranslate(system: string, text: string, maxTokens = 1024): Promise<string> {
  const openai = getOpenAI()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: text },
    ],
  })
  const result = response.choices[0]?.message?.content?.trim() ?? text
  console.log(`[translate] ${text.substring(0, 30)}... → ${result.substring(0, 30)}...`)
  return result
}

/**
 * Translate a chat message using GPT-4o-mini.
 * Handles informal language, slang, and regional Uzbek dialects.
 * Results are cached in translation_cache to avoid repeat API calls.
 */
export async function translateMessage(
  text: string,
  sourceLang: Locale,
  targetLang: Locale
): Promise<string> {
  if (!text || text.trim() === '') return ''
  if (sourceLang === targetLang) return text

  const sourceHash = crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')

  const supabase = await createClient()

  // Check cache first
  const { data: cached } = await supabase
    .from('translation_cache')
    .select('translated_text')
    .eq('source_hash', sourceHash)
    .eq('source_lang', sourceLang)
    .eq('target_lang', targetLang)
    .maybeSingle()

  if (cached) return cached.translated_text

  try {
    const translatedText = await chatTranslate(
      `You are a translation assistant for a job marketplace in Uzbekistan. Translate the following message from ${LANG_NAMES[sourceLang]} to ${LANG_NAMES[targetLang]}. The message is between a Chinese employer and an Uzbek worker. Preserve the tone and meaning exactly. Handle informal language, slang, and regional Uzbek dialects naturally. Return only the translated text — no explanations, no quotes.`,
      text
    )

    // Cache the result
    await supabase.from('translation_cache').insert({
      source_hash: sourceHash,
      source_lang: sourceLang,
      target_lang: targetLang,
      translated_text: translatedText,
    })

    return translatedText
  } catch (error) {
    console.error('[translateMessage] Failed:', error instanceof Error ? error.message : error)
    return text
  }
}

/**
 * Translate text using Google Cloud Translation API.
 * Used for long-form content (job descriptions, bios).
 * Checks translation_cache first. On API failure, returns original text.
 */
export async function translateText(
  text: string,
  targetLang: Locale,
  sourceLang?: string
): Promise<string> {
  if (!text || text.trim() === '') return ''

  const supabase = await createClient()

  // Check translation overrides first
  const termField = `term_${targetLang}` as const
  const { data: override } = await supabase
    .from('translation_overrides')
    .select('term_uz, term_zh, term_ru')
    .eq('term_en', text)
    .maybeSingle()

  if (override) {
    const val = (override as Record<string, string | null>)[termField]
    if (val) return val
  }

  const sourceHash = crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')

  // Check cache
  const { data: cached } = await supabase
    .from('translation_cache')
    .select('translated_text')
    .eq('source_hash', sourceHash)
    .eq('target_lang', targetLang)
    .maybeSingle()

  if (cached) return cached.translated_text

  // Translate using GPT-4o-mini
  try {
    const srcLabel = sourceLang ? LANG_NAMES[sourceLang as Locale] ?? sourceLang : 'auto-detect the source language'
    const translatedText = await chatTranslate(
      `You are a professional translator. Translate the following text from ${srcLabel} to ${LANG_NAMES[targetLang]}. Preserve the tone, meaning, and formatting. Return only the translated text — no explanations, no quotes.`,
      text,
      2048
    )

    await supabase.from('translation_cache').insert({
      source_hash: sourceHash,
      source_lang: sourceLang ?? 'unknown',
      target_lang: targetLang,
      translated_text: translatedText,
    })

    return translatedText
  } catch (error) {
    console.error('Translation failed:', error)
    return text
  }
}

/**
 * Translate a single job field using GPT-4o-mini.
 * Uses a professional job posting prompt.
 */
async function translateJobField(
  text: string,
  sourceLang: Locale,
  targetLang: Locale
): Promise<string> {
  if (!text || text.trim() === '') return ''
  if (sourceLang === targetLang) return text

  const sourceHash = crypto
    .createHash('sha256')
    .update(text)
    .digest('hex')

  const supabase = await createClient()

  const { data: cached } = await supabase
    .from('translation_cache')
    .select('translated_text')
    .eq('source_hash', sourceHash)
    .eq('source_lang', sourceLang)
    .eq('target_lang', targetLang)
    .maybeSingle()

  if (cached) return cached.translated_text

  try {
    const translatedText = await chatTranslate(
      `You are a professional translator for a job marketplace in Uzbekistan. Translate the following job posting field from ${LANG_NAMES[sourceLang]} to ${LANG_NAMES[targetLang]}. This is a formal job listing at a Chinese company operating in Uzbekistan. Use professional, clear language appropriate for a job posting. Preserve all numbers, salaries, and proper nouns exactly as written. Return only the translated text — no explanations, no quotes, no markdown.`,
      text,
      2048
    )

    await supabase.from('translation_cache').insert({
      source_hash: sourceHash,
      source_lang: sourceLang,
      target_lang: targetLang,
      translated_text: translatedText,
    })

    return translatedText
  } catch (error) {
    console.error('Job translation failed:', error)
    return text
  }
}

/**
 * Translate a job post into all 3 languages using GPT-4o-mini.
 * Returns translated fields. If any translation fails, the original text is used.
 */
export async function translateJob(
  job: {
    title_original?: string | null
    description_original?: string | null
    source_language?: string
  }
): Promise<TranslatedJob & { failed: boolean }> {
  const title = job.title_original ?? ''
  const description = job.description_original ?? ''
  const source = (job.source_language ?? 'zh') as Locale
  const targets: Locale[] = ['zh', 'uz', 'ru']

  let failed = false

  const results = await Promise.all(
    targets.flatMap((target) => [
      translateJobField(title, source, target).catch(() => {
        failed = true
        return title
      }),
      translateJobField(description, source, target).catch(() => {
        failed = true
        return description
      }),
    ])
  )

  return {
    title_zh: results[0],
    description_zh: results[1],
    title_uz: results[2],
    description_uz: results[3],
    title_ru: results[4],
    description_ru: results[5],
    failed,
  }
}

/**
 * Translate a job title to English for slug generation.
 */
export async function translateToEnglish(
  text: string,
  sourceLang: Locale
): Promise<string> {
  if (!text) return ''

  try {
    return await chatTranslate(
      `Translate the following text from ${LANG_NAMES[sourceLang]} to English. Return only the translated text — no explanations, no quotes.`,
      text,
      100
    )
  } catch {
    return text
  }
}

/**
 * Translate a worker bio into all 3 languages at once.
 */
export async function translateBio(
  bio: string,
  sourceLang: string
): Promise<TranslatedBio> {
  const [bioZh, bioUz, bioRu] = await Promise.all([
    translateText(bio, 'zh', sourceLang),
    translateText(bio, 'uz', sourceLang),
    translateText(bio, 'ru', sourceLang),
  ])

  return { bio_zh: bioZh, bio_uz: bioUz, bio_ru: bioRu }
}

/**
 * Translate a company description into all 3 locales.
 */
/**
 * Translate a profession/job title into all 3 locales.
 */
export async function translateProfession(
  profession: string,
  sourceLang: string
): Promise<{ profession_zh: string; profession_uz: string; profession_ru: string }> {
  if (!profession || profession.trim().length === 0) {
    return { profession_zh: '', profession_uz: '', profession_ru: '' }
  }
  const [profZh, profUz, profRu] = await Promise.all([
    sourceLang === 'zh' ? profession : translateMessage(profession, sourceLang as Locale, 'zh'),
    sourceLang === 'uz' ? profession : translateMessage(profession, sourceLang as Locale, 'uz'),
    sourceLang === 'ru' ? profession : translateMessage(profession, sourceLang as Locale, 'ru'),
  ])
  return { profession_zh: profZh, profession_uz: profUz, profession_ru: profRu }
}

export async function translateCompanyDescription(
  description: string,
  sourceLang: string
): Promise<{ description_zh: string; description_uz: string; description_ru: string }> {
  const [descZh, descUz, descRu] = await Promise.all([
    translateText(description, 'zh', sourceLang),
    translateText(description, 'uz', sourceLang),
    translateText(description, 'ru', sourceLang),
  ])

  return { description_zh: descZh, description_uz: descUz, description_ru: descRu }
}
