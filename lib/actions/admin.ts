'use server'

import { createClient } from '@/lib/supabase/server'
import { translateJob } from '@/lib/translate'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  success: boolean
  error?: string
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') throw new Error('Not authorized')
  return { supabase, userId: user.id }
}

// ── Dashboard ──

export async function getAdminStats() {
  const { supabase } = await requireAdmin()

  const [users, workers, companies, activeJobs, applications, pendingCompanies, pendingWorkers, failedJobs, reports] =
    await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'worker'),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('worker_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('translation_status', 'failed'),
      supabase.from('message_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

  return {
    totalUsers: users.count ?? 0,
    totalWorkers: workers.count ?? 0,
    totalCompanies: companies.count ?? 0,
    activeJobs: activeJobs.count ?? 0,
    totalApplications: applications.count ?? 0,
    pendingVerifications: (pendingCompanies.count ?? 0) + (pendingWorkers.count ?? 0),
    failedTranslations: failedJobs.count ?? 0,
    reportedMessages: reports.count ?? 0,
  }
}

export async function getDashboardChartData(days = 30) {
  const { supabase } = await requireAdmin()

  const [{ data: registrations }, { data: applications }] = await Promise.all([
    supabase.rpc('registrations_per_day', { days }),
    supabase.rpc('applications_per_day', { days }),
  ])

  return {
    registrations: registrations ?? [],
    applications: applications ?? [],
  }
}

export async function getRecentActivity(limit = 10) {
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from('notifications')
    .select('id, type, message_uz, message_zh, message_ru, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  return data ?? []
}

// ── Company Verification ──

export async function verifyCompany(companyId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin()

  const { error } = await supabase
    .from('companies')
    .update({ is_verified: true, verification_status: 'verified' })
    .eq('id', companyId)

  if (error) return { success: false, error: error.message }

  const { data: company } = await supabase
    .from('companies')
    .select('user_id, name_original')
    .eq('id', companyId)
    .single()

  if (company) {
    await supabase.from('notifications').insert({
      user_id: company.user_id,
      type: 'company_verified',
      message_uz: `"${company.name_original}" kompaniyasi tasdiqlandi`,
      message_zh: `公司"${company.name_original}"已通过审核`,
      message_ru: `Компания "${company.name_original}" подтверждена`,
    })
  }

  revalidatePath('/[locale]/admin/companies', 'page')
  return { success: true }
}

export async function rejectCompany(companyId: string, reason: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('companies')
    .update({ is_verified: false, verification_status: 'rejected' })
    .eq('id', companyId)

  if (error) return { success: false, error: error.message }

  const { data: company } = await supabase
    .from('companies')
    .select('user_id, name_original')
    .eq('id', companyId)
    .single()

  if (company) {
    await supabase.from('notifications').insert({
      user_id: company.user_id,
      type: 'company_rejected',
      message_uz: `"${company.name_original}" kompaniyasi rad etildi: ${reason}`,
      message_zh: `公司"${company.name_original}"审核未通过：${reason}`,
      message_ru: `Компания "${company.name_original}" отклонена: ${reason}`,
    })
  }

  revalidatePath('/[locale]/admin/companies', 'page')
  return { success: true }
}

// ── Worker Verification ──

export async function verifyWorker(workerId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('worker_profiles')
    .update({ is_verified: true, verification_status: 'verified' })
    .eq('id', workerId)

  if (error) return { success: false, error: error.message }

  const { data: worker } = await supabase
    .from('worker_profiles')
    .select('user_id')
    .eq('id', workerId)
    .single()

  if (worker) {
    await supabase.from('notifications').insert({
      user_id: worker.user_id,
      type: 'worker_verified',
      message_uz: 'Profilingiz tasdiqlandi',
      message_zh: '您的个人资料已通过审核',
      message_ru: 'Ваш профиль подтверждён',
    })
  }

  revalidatePath('/[locale]/admin/workers', 'page')
  return { success: true }
}

export async function rejectWorker(workerId: string, reason: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('worker_profiles')
    .update({ is_verified: false, verification_status: 'rejected' })
    .eq('id', workerId)

  if (error) return { success: false, error: error.message }

  const { data: worker } = await supabase
    .from('worker_profiles')
    .select('user_id')
    .eq('id', workerId)
    .single()

  if (worker) {
    await supabase.from('notifications').insert({
      user_id: worker.user_id,
      type: 'worker_rejected',
      message_uz: `Profilingiz rad etildi: ${reason}`,
      message_zh: `您的个人资料审核未通过：${reason}`,
      message_ru: `Ваш профиль отклонён: ${reason}`,
    })
  }

  revalidatePath('/[locale]/admin/workers', 'page')
  return { success: true }
}

// ── User Management ──

export async function suspendUser(userId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/users', 'page')
  return { success: true }
}

export async function reactivateUser(userId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/users', 'page')
  return { success: true }
}

export async function makeAdmin(userId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/users', 'page')
  return { success: true }
}

// ── Job Management ──

export async function updateJobAdmin(jobId: string, status: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/jobs', 'page')
  return { success: true }
}

export async function retryTranslation(jobId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { data: job } = await supabase
    .from('jobs')
    .select('title_original, description_original, source_language')
    .eq('id', jobId)
    .single()

  if (!job) return { success: false, error: 'Job not found' }

  const translated = await translateJob(job)

  const { error } = await supabase
    .from('jobs')
    .update({
      ...translated,
      translation_status: translated.failed ? 'failed' : 'done',
    })
    .eq('id', jobId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/jobs', 'page')
  return { success: true }
}

export async function manualTranslation(
  table: string,
  id: string,
  field: string,
  text: string
): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const allowedTables = ['jobs', 'worker_profiles']
  if (!allowedTables.includes(table)) return { success: false, error: 'Invalid table' }

  const { error } = await supabase
    .from(table)
    .update({ [field]: text, translation_status: 'done' })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/translations', 'page')
  return { success: true }
}

// ── Translation Overrides ──

export async function saveTranslationOverride(data: {
  id?: string
  term_en: string
  term_zh?: string
  term_uz?: string
  term_ru?: string
}): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin()

  if (data.id) {
    const { error } = await supabase
      .from('translation_overrides')
      .update({
        term_en: data.term_en,
        term_zh: data.term_zh || null,
        term_uz: data.term_uz || null,
        term_ru: data.term_ru || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)

    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('translation_overrides').insert({
      term_en: data.term_en,
      term_zh: data.term_zh || null,
      term_uz: data.term_uz || null,
      term_ru: data.term_ru || null,
      created_by: userId,
    })

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/[locale]/admin/translations', 'page')
  return { success: true }
}

export async function deleteTranslationOverride(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('translation_overrides')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/translations', 'page')
  return { success: true }
}

// ── Message Reports ──

export async function reviewReport(reportId: string, action: 'reviewed' | 'dismissed'): Promise<ActionResult> {
  const { supabase, userId } = await requireAdmin()

  const { error } = await supabase
    .from('message_reports')
    .update({
      status: action,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/[locale]/admin/messages', 'page')
  return { success: true }
}

// ── Admin Conversations ──

export async function getAdminConversations() {
  const { supabase } = await requireAdmin()

  // Get all messages with sender/receiver profiles
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      job_id,
      body_original,
      body_uz,
      body_zh,
      body_ru,
      source_language,
      created_at,
      sender:profiles!messages_sender_id_fkey(id, full_name, role),
      receiver:profiles!messages_receiver_id_fkey(id, full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (!messages || messages.length === 0) return []

  // Group by conversation pair (sorted sender+receiver + job_id)
  const convMap = new Map<string, {
    participant1: { id: string; name: string; role: string }
    participant2: { id: string; name: string; role: string }
    jobId: string | null
    lastMessage: string
    lastMessageAt: string
    messageCount: number
  }>()

  for (const msg of messages) {
    const ids = [msg.sender_id, msg.receiver_id].sort()
    const key = `${ids[0]}|${ids[1]}|${msg.job_id ?? 'none'}`

    if (!convMap.has(key)) {
      const sender = msg.sender as unknown as Record<string, string> | null
      const receiver = msg.receiver as unknown as Record<string, string> | null
      const p1Id = ids[0]
      const p1 = p1Id === msg.sender_id ? sender : receiver
      const p2 = p1Id === msg.sender_id ? receiver : sender

      convMap.set(key, {
        participant1: { id: p1Id, name: (p1?.full_name as string) ?? 'Unknown', role: (p1?.role as string) ?? '' },
        participant2: { id: ids[1], name: (p2?.full_name as string) ?? 'Unknown', role: (p2?.role as string) ?? '' },
        jobId: msg.job_id,
        lastMessage: msg.body_original,
        lastMessageAt: msg.created_at,
        messageCount: 0,
      })
    }

    const conv = convMap.get(key)!
    conv.messageCount++
  }

  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  )
}

export async function getAdminConversationMessages(
  participantA: string,
  participantB: string,
  jobId?: string | null
) {
  const { supabase } = await requireAdmin()

  let query = supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      receiver_id,
      body_original,
      body_uz,
      body_zh,
      body_ru,
      source_language,
      created_at,
      sender:profiles!messages_sender_id_fkey(full_name, role)
    `)
    .or(`and(sender_id.eq.${participantA},receiver_id.eq.${participantB}),and(sender_id.eq.${participantB},receiver_id.eq.${participantA})`)
    .order('created_at', { ascending: true })

  if (jobId) {
    query = query.eq('job_id', jobId)
  }

  const { data } = await query
  return data ?? []
}

export async function reportMessage(messageId: string, reason: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('message_reports').insert({
    message_id: messageId,
    reported_by: user.id,
    reason,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already reported' }
    return { success: false, error: error.message }
  }

  return { success: true }
}
