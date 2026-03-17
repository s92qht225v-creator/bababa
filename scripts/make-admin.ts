/**
 * Make a user an admin by email.
 * Usage: npx tsx scripts/make-admin.ts user@example.com
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  // Find user by email via auth admin API
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error('Error listing users:', listError.message)
    process.exit(1)
  }

  const authUser = users.users.find((u) => u.email === email)

  if (!authUser) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', authUser.id)

  if (error) {
    console.error('Error updating profile:', error.message)
    process.exit(1)
  }

  console.log(`Successfully made ${email} (${authUser.id}) an admin.`)
}

main()
