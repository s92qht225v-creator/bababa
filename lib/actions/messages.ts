'use server'

import { createClient } from '@/lib/supabase/server'
import { translateMessage } from '@/lib/translate'
import type { Locale } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
  data?: Record<string, unknown>
}

const LANG_LABELS: Record<string, Record<string, string>> = {
  uz: { uz: "O'zbek", zh: 'Xitoy', ru: 'Rus' },
  zh: { uz: '乌兹别克语', zh: '中文', ru: '俄语' },
  ru: { uz: 'Узбекский', zh: 'Китайский', ru: 'Русский' },
}

/**
 * Send a message with automatic translation to all 3 languages.
 */
export async function sendMessage(
  receiverId: string,
  body: string,
  jobId: string | null,
  senderLang: Locale
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!body || body.trim().length === 0)
    return { success: false, error: 'Message is empty' }
  if (body.length > 2000)
    return { success: false, error: 'Message too long' }

  // Translate to all 3 languages
  const targets: Locale[] = ['uz', 'zh', 'ru']
  const translations: Record<string, string> = {}

  await Promise.all(
    targets.map(async (targetLang) => {
      if (targetLang === senderLang) {
        translations[targetLang] = body
      } else {
        try {
          const translated = await translateMessage(body, senderLang, targetLang)
          translations[targetLang] = translated
          console.log(`[sendMessage] ${senderLang}→${targetLang}: "${body.substring(0, 30)}" → "${translated.substring(0, 30)}"`)
        } catch (err) {
          console.error(`[sendMessage] Translation ${senderLang}→${targetLang} FAILED:`, err instanceof Error ? err.message : err)
          translations[targetLang] = body
        }
      }
    })
  )

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      job_id: jobId || null,
      body_original: body,
      body_zh: translations.zh,
      body_uz: translations.uz,
      body_ru: translations.ru,
      source_language: senderLang,
      is_read: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Send message error:', error)
    return { success: false, error: 'Failed to send message' }
  }

  // Get sender name for notification
  const { data: senderProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Create notification for receiver
  await supabase.from('notifications').insert({
    user_id: receiverId,
    type: 'new_message',
    title: `New message from ${senderProfile?.full_name ?? 'Someone'}`,
    body: body.substring(0, 60),
    payload: {
      sender_id: user.id,
      message_id: message.id,
      job_id: jobId,
    },
  })

  // Send email notification (fire-and-forget)
  const { data: receiverProfile } = await supabase
    .from('profiles')
    .select('email, full_name, role, language_preference')
    .eq('id', receiverId)
    .single()

  if (receiverProfile?.email) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    fetch(`${supabaseUrl}/functions/v1/notify-new-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverEmail: receiverProfile.email,
        receiverName: receiverProfile.full_name ?? '',
        receiverRole: receiverProfile.role ?? 'worker',
        senderName: senderProfile?.full_name ?? 'Someone',
        messagePreview: body.substring(0, 150),
        locale: receiverProfile.language_preference ?? 'uz',
      }),
    }).catch(() => {}) // swallow errors — email is best-effort
  }

  return { success: true, data: { message_id: message.id } }
}

/**
 * Get conversations for the current user (grouped by partner + job).
 */
export async function getConversations() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get all messages where user is sender or receiver
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, job_id, body_original, body_zh, body_uz, body_ru, source_language, is_read, created_at')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (!messages || messages.length === 0) return []

  // Group by conversation partner + job
  const convMap = new Map<
    string,
    {
      partnerId: string
      jobId: string | null
      lastMessage: typeof messages[0]
      unreadCount: number
    }
  >()

  for (const msg of messages) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
    const key = `${partnerId}:${msg.job_id ?? 'none'}`

    if (!convMap.has(key)) {
      convMap.set(key, {
        partnerId,
        jobId: msg.job_id,
        lastMessage: msg,
        unreadCount: 0,
      })
    }

    // Count unread messages from partner
    if (msg.receiver_id === user.id && !msg.is_read) {
      const conv = convMap.get(key)!
      conv.unreadCount++
    }
  }

  const conversations = Array.from(convMap.values())

  // Get partner profiles
  const partnerIds = [...new Set(conversations.map((c) => c.partnerId))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, language_preference')
    .in('id', partnerIds.length > 0 ? partnerIds : ['none'])

  // Get job titles
  const jobIds = [...new Set(conversations.filter((c) => c.jobId).map((c) => c.jobId!))]
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title_original, title_zh, title_uz, title_ru')
    .in('id', jobIds.length > 0 ? jobIds : ['none'])

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])
  const jobMap = new Map(jobs?.map((j) => [j.id, j]) ?? [])

  return conversations.map((conv) => ({
    partnerId: conv.partnerId,
    partnerName: profileMap.get(conv.partnerId)?.full_name ?? 'Unknown',
    partnerAvatar: profileMap.get(conv.partnerId)?.avatar_url ?? null,
    partnerLang: profileMap.get(conv.partnerId)?.language_preference ?? 'uz',
    jobId: conv.jobId,
    jobTitle: conv.jobId
      ? jobMap.get(conv.jobId)?.title_original ?? null
      : null,
    jobTitleZh: conv.jobId ? jobMap.get(conv.jobId)?.title_zh ?? null : null,
    jobTitleUz: conv.jobId ? jobMap.get(conv.jobId)?.title_uz ?? null : null,
    jobTitleRu: conv.jobId ? jobMap.get(conv.jobId)?.title_ru ?? null : null,
    lastMessage: conv.lastMessage,
    unreadCount: conv.unreadCount,
  }))
}

/**
 * Get messages between current user and a partner (optionally for a job).
 */
export async function getMessages(partnerId: string, jobId?: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  if (jobId) {
    query = query.eq('job_id', jobId)
  }

  const { data } = await query
  return data ?? []
}

/**
 * Mark all messages from a partner as read.
 */
export async function markAsRead(partnerId: string, jobId?: string | null) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  let query = supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', partnerId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  if (jobId) {
    query = query.eq('job_id', jobId)
  }

  const { error } = await query

  if (error) {
    console.error('[markAsRead] Failed:', error.message, { partnerId, jobId, userId: user.id })
  }
}

/**
 * Get total unread message count for current user.
 */
export async function getUnreadCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  return count ?? 0
}

/**
 * Get or create a conversation between employer and worker for a job.
 * Returns the partnerId and jobId for navigation.
 */
export async function getOrCreateConversation(
  workerId: string,
  jobId: string | null,
  initialMessage?: string,
  senderLang?: Locale
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get the worker's user_id from worker_profiles
  const { data: workerProfile } = await supabase
    .from('worker_profiles')
    .select('user_id')
    .eq('id', workerId)
    .single()

  const receiverId = workerProfile?.user_id ?? workerId

  // Check if conversation exists
  let query = supabase
    .from('messages')
    .select('id')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
    )
    .limit(1)

  if (jobId) {
    query = query.eq('job_id', jobId)
  }

  const { data: existing } = await query

  // If no existing conversation and initial message provided, send it
  if ((!existing || existing.length === 0) && initialMessage && senderLang) {
    await sendMessage(receiverId, initialMessage, jobId, senderLang)
  }

  return {
    success: true,
    data: { partnerId: receiverId, jobId },
  }
}
