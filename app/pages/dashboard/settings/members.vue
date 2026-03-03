<script setup lang="ts">
import type { Component } from 'vue'
import {
  Users, UserPlus, Shield, ShieldCheck, Crown,
  MoreHorizontal, Trash2, ChevronDown, Loader2,
  Mail, Clock, X, Check, AlertTriangle, RefreshCw,
  Link2, Copy, Eye, EyeOff, UserCheck, UserX, MessageSquare, Search,
} from 'lucide-vue-next'

definePageMeta({})

useSeoMeta({
  title: 'Team Members — Reqcore',
  description: 'Manage your team members and invitations',
})

const { activeOrg } = useCurrentOrg()
const { data: session } = await authClient.useSession(useFetch)
const { allowed: canManageMembers } = usePermission({ member: ['create'] })
const { allowed: canInvite } = usePermission({ invitation: ['create'] })
const { allowed: canCancelInvite } = usePermission({ invitation: ['cancel'] })
const {
  listInviteLinks: fetchInviteLinksApi,
  createInviteLink: createInviteLinkApi,
  revokeInviteLink: revokeInviteLinkApi,
} = useInviteLinks()

// ─────────────────────────────────────────────
// Members list
// ─────────────────────────────────────────────
const members = ref<Array<{
  id: string
  userId: string
  role: string
  user: { name: string; email: string; image?: string }
  createdAt: Date
}>>([])
const isLoadingMembers = ref(true)
const membersError = ref('')

async function fetchMembers() {
  isLoadingMembers.value = true
  membersError.value = ''
  try {
    const result = await authClient.organization.listMembers()
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to load members'))
    members.value = (result.data?.members ?? []) as typeof members.value
  }
  catch (err: unknown) {
    membersError.value = err instanceof Error ? err.message : 'Failed to load members'
  }
  finally {
    isLoadingMembers.value = false
  }
}

onMounted(fetchMembers)

// ─────────────────────────────────────────────
// Members search & pagination
// ─────────────────────────────────────────────
const memberSearch = ref('')
const membersPerPage = 20
const visibleCount = ref(membersPerPage)

const filteredMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return members.value
  return members.value.filter(m =>
    m.user.name?.toLowerCase().includes(q)
    || m.user.email?.toLowerCase().includes(q)
    || m.role.toLowerCase().includes(q),
  )
})

const visibleMembers = computed(() => filteredMembers.value.slice(0, visibleCount.value))
const hasMoreMembers = computed(() => visibleCount.value < filteredMembers.value.length)

function showMoreMembers() {
  visibleCount.value += membersPerPage
}

// Reset visible count when search changes
watch(memberSearch, () => {
  visibleCount.value = membersPerPage
})

// ─────────────────────────────────────────────
// Invite member
// ─────────────────────────────────────────────
const showInviteForm = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<'admin' | 'member'>('member')
const isInviting = ref(false)
const inviteSuccess = ref('')
const inviteError = ref('')

function resetInviteForm() {
  inviteEmail.value = ''
  inviteRole.value = 'member'
  inviteError.value = ''
  inviteSuccess.value = ''
}

async function handleInvite() {
  if (!canInvite.value || !inviteEmail.value.trim()) return
  isInviting.value = true
  inviteError.value = ''
  inviteSuccess.value = ''

  try {
    const result = await authClient.organization.inviteMember({
      email: inviteEmail.value.trim().toLowerCase(),
      role: inviteRole.value,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to send invitation'))
    inviteSuccess.value = `Invitation sent to ${inviteEmail.value.trim()}`
    inviteEmail.value = ''
    inviteRole.value = 'member'
    setTimeout(() => { inviteSuccess.value = '' }, 5000)
    await fetchInvitations()
  }
  catch (err: unknown) {
    inviteError.value = err instanceof Error ? err.message : 'Failed to send invitation'
  }
  finally {
    isInviting.value = false
  }
}

// ─────────────────────────────────────────────
// Pending invitations
// ─────────────────────────────────────────────
const pendingInvitations = ref<Array<{
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
  inviterId: string
}>>([])
const isLoadingInvitations = ref(true)
const invitationsError = ref('')
const resendingInvitation = ref<string | null>(null)
const cancellingInvitation = ref<string | null>(null)
const resendSuccess = ref('')

async function fetchInvitations() {
  isLoadingInvitations.value = true
  invitationsError.value = ''
  try {
    const result = await authClient.organization.listInvitations({
      query: {},
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to load invitations'))
    const allInvitations = (result.data ?? []) as typeof pendingInvitations.value
    pendingInvitations.value = allInvitations.filter(inv => inv.status === 'pending')
  }
  catch (err: unknown) {
    invitationsError.value = err instanceof Error ? err.message : 'Failed to load invitations'
  }
  finally {
    isLoadingInvitations.value = false
  }
}

onMounted(fetchInvitations)

async function handleResendInvitation(invitation: { id: string; email: string; role: string }) {
  resendingInvitation.value = invitation.id
  resendSuccess.value = ''
  inviteError.value = ''

  try {
    const result = await authClient.organization.inviteMember({
      email: invitation.email,
      role: invitation.role as 'admin' | 'member',
      resend: true,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to resend invitation'))
    resendSuccess.value = `Invitation resent to ${invitation.email}`
    setTimeout(() => { resendSuccess.value = '' }, 5000)
    await fetchInvitations()
  }
  catch (err: unknown) {
    inviteError.value = err instanceof Error ? err.message : 'Failed to resend invitation'
  }
  finally {
    resendingInvitation.value = null
  }
}

async function handleCancelInvitation(invitationId: string) {
  cancellingInvitation.value = invitationId

  try {
    const result = await authClient.organization.cancelInvitation({
      invitationId,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to cancel invitation'))
    await fetchInvitations()
  }
  catch (err: unknown) {
    invitationsError.value = err instanceof Error ? err.message : 'Failed to cancel invitation'
  }
  finally {
    cancellingInvitation.value = null
  }
}

function isExpired(expiresAt: Date | string): boolean {
  return new Date(expiresAt) < new Date()
}

function formatExpiresAt(expiresAt: Date | string): string {
  const date = new Date(expiresAt)
  if (date < new Date()) return 'Expired'
  const diffMs = date.getTime() - Date.now()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `Expires in ${diffMinutes}m`
  }
  if (diffHours < 24) return `Expires in ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `Expires in ${diffDays}d`
}

// ─────────────────────────────────────────────
// Invite links (shareable)
// ─────────────────────────────────────────────
const inviteLinks = ref<InviteLink[]>([])
const isLoadingLinks = ref(true)
const linksError = ref('')
const showCreateLinkForm = ref(false)
const newLinkRole = ref<'admin' | 'member'>('member')
const newLinkMaxUses = ref<string>('')
const newLinkExpiresInHours = ref(168) // 7 days default
const isCreatingLink = ref(false)
const createLinkError = ref('')
const createLinkSuccess = ref('')
const copiedLinkId = ref<string | null>(null)
const revokingLinkId = ref<string | null>(null)

async function fetchInviteLinks() {
  isLoadingLinks.value = true
  linksError.value = ''
  try {
    inviteLinks.value = await fetchInviteLinksApi()
  }
  catch (err: unknown) {
    linksError.value = err instanceof Error ? err.message : 'Failed to load invite links'
  }
  finally {
    isLoadingLinks.value = false
  }
}

onMounted(fetchInviteLinks)

async function handleCreateLink() {
  isCreatingLink.value = true
  createLinkError.value = ''
  createLinkSuccess.value = ''

  try {
    const maxUses = newLinkMaxUses.value.trim() ? parseInt(newLinkMaxUses.value, 10) : null
    if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) {
      createLinkError.value = 'Max uses must be a positive number'
      return
    }

    await createInviteLinkApi({
      role: newLinkRole.value,
      maxUses,
      expiresInHours: newLinkExpiresInHours.value,
    })

    createLinkSuccess.value = 'Invite link created!'
    showCreateLinkForm.value = false
    newLinkRole.value = 'member'
    newLinkMaxUses.value = ''
    newLinkExpiresInHours.value = 168
    setTimeout(() => { createLinkSuccess.value = '' }, 5000)
    await fetchInviteLinks()
  }
  catch (err: any) {
    createLinkError.value = err?.data?.statusMessage || 'Failed to create invite link'
  }
  finally {
    isCreatingLink.value = false
  }
}

function getInviteLinkUrl(token: string): string {
  return `${window.location.origin}/join/${token}`
}

async function copyLinkToClipboard(link: { id: string; token: string }) {
  try {
    await navigator.clipboard.writeText(getInviteLinkUrl(link.token))
    copiedLinkId.value = link.id
    setTimeout(() => { copiedLinkId.value = null }, 2000)
  }
  catch {
    // Fallback for non-secure contexts
    const textArea = document.createElement('textarea')
    textArea.value = getInviteLinkUrl(link.token)
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copiedLinkId.value = link.id
    setTimeout(() => { copiedLinkId.value = null }, 2000)
  }
}

async function handleRevokeLink(linkId: string) {
  revokingLinkId.value = linkId

  try {
    await revokeInviteLinkApi(linkId)
    await fetchInviteLinks()
  }
  catch (err: any) {
    linksError.value = err?.data?.statusMessage || 'Failed to revoke invite link'
  }
  finally {
    revokingLinkId.value = null
  }
}

function isLinkActive(link: { expiresAt: string; maxUses: number | null; useCount: number }): boolean {
  const notExpired = new Date(link.expiresAt) > new Date()
  const notExhausted = link.maxUses === null || link.useCount < link.maxUses
  return notExpired && notExhausted
}

const expiryOptions = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
  { label: '14 days', value: 336 },
  { label: '30 days', value: 720 },
]

// ─────────────────────────────────────────────
// Join requests
// ─────────────────────────────────────────────
const joinRequests = ref<Array<{
  id: string
  message: string | null
  status: string
  createdAt: string
  userName: string
  userEmail: string
  userImage: string | null
}>>([])
const isLoadingJoinRequests = ref(true)
const joinRequestsError = ref('')
const approvingRequestId = ref<string | null>(null)
const rejectingRequestId = ref<string | null>(null)
const joinRequestActionError = ref('')

async function fetchJoinRequests() {
  isLoadingJoinRequests.value = true
  joinRequestsError.value = ''
  try {
    const data = await $fetch('/api/join-requests')
    joinRequests.value = data as typeof joinRequests.value
  }
  catch (err: unknown) {
    joinRequestsError.value = err instanceof Error ? err.message : 'Failed to load join requests'
  }
  finally {
    isLoadingJoinRequests.value = false
  }
}

onMounted(fetchJoinRequests)

async function handleApproveRequest(requestId: string) {
  approvingRequestId.value = requestId
  joinRequestActionError.value = ''

  try {
    await $fetch(`/api/join-requests/${requestId}/approve`, { method: 'POST' })
    await Promise.all([fetchJoinRequests(), fetchMembers()])
  }
  catch (err: any) {
    joinRequestActionError.value = err?.data?.statusMessage || 'Failed to approve request'
  }
  finally {
    approvingRequestId.value = null
  }
}

async function handleRejectRequest(requestId: string) {
  rejectingRequestId.value = requestId
  joinRequestActionError.value = ''

  try {
    await $fetch(`/api/join-requests/${requestId}/reject`, { method: 'POST' })
    await fetchJoinRequests()
  }
  catch (err: any) {
    joinRequestActionError.value = err?.data?.statusMessage || 'Failed to reject request'
  }
  finally {
    rejectingRequestId.value = null
  }
}

// ─────────────────────────────────────────────
// Role management
// ─────────────────────────────────────────────
const activeDropdown = ref<string | null>(null)
const isUpdatingRole = ref<string | null>(null)
const roleUpdateError = ref('')

function toggleDropdown(memberId: string) {
  activeDropdown.value = activeDropdown.value === memberId ? null : memberId
}

function closeDropdown() {
  activeDropdown.value = null
}

async function handleUpdateRole(memberId: string, newRole: 'admin' | 'member') {
  isUpdatingRole.value = memberId
  roleUpdateError.value = ''

  try {
    const result = await authClient.organization.updateMemberRole({
      memberId,
      role: newRole,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to update role'))
    await fetchMembers()
  }
  catch (err: unknown) {
    roleUpdateError.value = err instanceof Error ? err.message : 'Failed to update role'
  }
  finally {
    isUpdatingRole.value = null
    closeDropdown()
  }
}

// ─────────────────────────────────────────────
// Remove member
// ─────────────────────────────────────────────
const memberToRemove = ref<{ id: string; name: string } | null>(null)
const isRemoving = ref(false)
const removeError = ref('')

async function handleRemoveMember() {
  if (!memberToRemove.value) return

  // Guard: prevent removing yourself even if called programmatically
  const currentUserId = session.value?.user?.id
  const targetMember = members.value.find(m => m.id === memberToRemove.value?.id)
  if (targetMember && currentUserId && targetMember.userId === currentUserId) {
    removeError.value = 'You cannot remove yourself from the organization.'
    return
  }

  isRemoving.value = true
  removeError.value = ''

  try {
    const result = await authClient.organization.removeMember({
      memberIdOrEmail: memberToRemove.value.id,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Failed to remove member'))
    memberToRemove.value = null
    await fetchMembers()
  }
  catch (err: unknown) {
    removeError.value = err instanceof Error ? err.message : 'Failed to remove member'
  }
  finally {
    isRemoving.value = false
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const roleConfig: Record<string, { label: string; color: string; bg: string; icon: Component }> = {
  owner: { label: 'Owner', color: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-950', icon: Crown },
  admin: { label: 'Admin', color: 'text-brand-700 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950', icon: ShieldCheck },
  member: { label: 'Member', color: 'text-surface-700 dark:text-surface-300', bg: 'bg-surface-100 dark:bg-surface-800', icon: Shield },
}

function getRoleConfig(role: string) {
  return roleConfig[role] ?? roleConfig.member!
}

function isCurrentUser(userId: string) {
  return session.value?.user?.id === userId
}

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// Close dropdown on click outside — store reference for cleanup
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('[data-member-actions]')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <!-- Page title -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-surface-900 dark:text-surface-50">
        Members
      </h1>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
        Manage your team members and invitations.
      </p>
    </div>

    <!-- Invite member section -->
    <section v-if="canInvite" class="mb-6">
      <button
        v-if="!showInviteForm"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        @click="showInviteForm = true"
      >
        <UserPlus class="size-4" />
        Invite team member
      </button>

      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showInviteForm" class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UserPlus class="size-5 text-brand-600 dark:text-brand-400" />
              <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Invite a team member</h3>
            </div>
            <button
              class="p-1 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              @click="showInviteForm = false; resetInviteForm()"
            >
              <X class="size-4" />
            </button>
          </div>

          <div class="flex gap-3">
            <div class="flex-1">
              <label for="invite-email" class="sr-only">Email address</label>
              <input
                id="invite-email"
                v-model="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                @keydown.enter="handleInvite"
              />
            </div>

            <div class="relative">
              <select
                v-model="inviteRole"
                class="appearance-none rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-3 pr-8 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-surface-400 pointer-events-none" />
            </div>

            <button
              :disabled="isInviting || !inviteEmail.trim()"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              @click="handleInvite"
            >
              <Loader2 v-if="isInviting" class="size-4 animate-spin" />
              <Mail v-else class="size-4" />
              {{ isInviting ? 'Sending…' : 'Send invite' }}
            </button>
          </div>

          <Transition
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div v-if="inviteSuccess" class="mt-3 flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
              <Check class="size-4" />
              {{ inviteSuccess }}
            </div>
          </Transition>

          <div v-if="inviteError" class="mt-3 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-3 py-2 text-sm text-danger-700 dark:text-danger-400">
            {{ inviteError }}
          </div>
        </div>
      </Transition>
    </section>

    <!-- Role update error banner -->
    <div v-if="roleUpdateError" class="mb-4 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-4 py-3 text-sm text-danger-700 dark:text-danger-400 flex items-center justify-between">
      <span>{{ roleUpdateError }}</span>
      <button class="text-danger-500 hover:text-danger-700 transition-colors" @click="roleUpdateError = ''">
        <X class="size-4" />
      </button>
    </div>

    <!-- Resend success banner -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="resendSuccess" class="mb-4 flex items-center gap-2 rounded-lg bg-success-50 dark:bg-success-950/40 border border-success-200 dark:border-success-900 px-4 py-3 text-sm text-success-700 dark:text-success-400">
        <Check class="size-4" />
        {{ resendSuccess }}
      </div>
    </Transition>

    <!-- Pending invitations -->
    <section v-if="canInvite && (isLoadingInvitations || pendingInvitations.length > 0)" class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-6 py-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-8 rounded-lg bg-warning-50 dark:bg-warning-950 text-warning-600 dark:text-warning-400">
            <Clock class="size-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Pending invitations</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              {{ isLoadingInvitations ? 'Loading…' : `${pendingInvitations.length} pending` }}
            </p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingInvitations" class="px-6 py-6 text-center text-surface-400 text-sm">
        <Loader2 class="size-4 animate-spin mx-auto mb-1.5" />
        Loading invitations…
      </div>

      <!-- Error state -->
      <div v-else-if="invitationsError" class="px-6 py-6 text-center">
        <AlertTriangle class="size-5 text-danger-400 mx-auto mb-1.5" />
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ invitationsError }}</p>
        <button class="mt-1.5 text-sm text-brand-600 hover:text-brand-700 underline" @click="fetchInvitations">
          Retry
        </button>
      </div>

      <!-- Invitations list -->
      <div v-else class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
          v-for="inv in pendingInvitations"
          :key="inv.id"
          class="px-6 py-3.5 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
        >
          <!-- Email icon -->
          <div class="flex-shrink-0">
            <div class="size-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 dark:text-surface-500">
              <Mail class="size-4" />
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
              {{ inv.email }}
            </div>
            <div class="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
              <span
                :class="[getRoleConfig(inv.role).bg, getRoleConfig(inv.role).color]"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              >
                <component :is="getRoleConfig(inv.role).icon" class="size-2.5" />
                {{ getRoleConfig(inv.role).label }}
              </span>
              <span :class="isExpired(inv.expiresAt) ? 'text-danger-500' : ''">
                {{ formatExpiresAt(inv.expiresAt) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="canCancelInvite" class="flex items-center gap-1.5 flex-shrink-0">
            <button
              :disabled="resendingInvitation === inv.id"
              class="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Resend invitation email"
              @click="handleResendInvitation(inv)"
            >
              <Loader2 v-if="resendingInvitation === inv.id" class="size-3 animate-spin" />
              <RefreshCw v-else class="size-3" />
              Resend
            </button>
            <button
              :disabled="cancellingInvitation === inv.id"
              class="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 dark:border-danger-800 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel invitation"
              @click="handleCancelInvitation(inv.id)"
            >
              <Loader2 v-if="cancellingInvitation === inv.id" class="size-3 animate-spin" />
              <X v-else class="size-3" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Invite links section -->
    <section v-if="canInvite" class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-6 py-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center size-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Link2 class="size-4" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Invite links</h2>
              <p class="text-xs text-surface-500 dark:text-surface-400">
                Shareable links to join your organization
              </p>
            </div>
          </div>
          <button
            v-if="!showCreateLinkForm"
            class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
            @click="showCreateLinkForm = true"
          >
            <Link2 class="size-3.5" />
            Create link
          </button>
        </div>
      </div>

      <!-- Create link form -->
      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showCreateLinkForm" class="px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/50">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-surface-900 dark:text-surface-100">New invite link</h3>
            <button
              class="p-1 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
              @click="showCreateLinkForm = false; createLinkError = ''"
            >
              <X class="size-4" />
            </button>
          </div>

          <div class="flex flex-wrap gap-3 items-end">
            <div>
              <label class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Role</label>
              <div class="relative">
                <select
                  v-model="newLinkRole"
                  class="appearance-none rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-3 pr-8 py-1.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-surface-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Expires in</label>
              <div class="relative">
                <select
                  v-model="newLinkExpiresInHours"
                  class="appearance-none rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-3 pr-8 py-1.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors cursor-pointer"
                >
                  <option v-for="opt in expiryOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
                <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-surface-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">Max uses (optional)</label>
              <input
                v-model="newLinkMaxUses"
                type="number"
                min="1"
                placeholder="Unlimited"
                class="w-28 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
              />
            </div>

            <button
              :disabled="isCreatingLink"
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleCreateLink"
            >
              <Loader2 v-if="isCreatingLink" class="size-3.5 animate-spin" />
              Create
            </button>
          </div>

          <div v-if="createLinkError" class="mt-2 text-xs text-danger-600 dark:text-danger-400">
            {{ createLinkError }}
          </div>
        </div>
      </Transition>

      <!-- Success banner -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="createLinkSuccess" class="px-6 py-2 flex items-center gap-2 text-sm text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/40 border-b border-success-200 dark:border-success-900">
          <Check class="size-4" />
          {{ createLinkSuccess }}
        </div>
      </Transition>

      <!-- Loading state -->
      <div v-if="isLoadingLinks" class="px-6 py-6 text-center text-surface-400 text-sm">
        <Loader2 class="size-4 animate-spin mx-auto mb-1.5" />
        Loading invite links…
      </div>

      <!-- Error state -->
      <div v-else-if="linksError" class="px-6 py-6 text-center">
        <AlertTriangle class="size-5 text-danger-400 mx-auto mb-1.5" />
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ linksError }}</p>
        <button class="mt-1.5 text-sm text-brand-600 hover:text-brand-700 underline" @click="fetchInviteLinks">
          Retry
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="inviteLinks.length === 0 && !showCreateLinkForm" class="px-6 py-6 text-center text-sm text-surface-400 dark:text-surface-500">
        No active invite links. Create one to share with your team.
      </div>

      <!-- Links list -->
      <div v-else-if="inviteLinks.length > 0" class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
          v-for="link in inviteLinks"
          :key="link.id"
          class="px-6 py-3.5 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
          :class="{ 'opacity-50': !isLinkActive(link) }"
        >
          <div class="flex-shrink-0">
            <div class="size-9 rounded-full flex items-center justify-center"
              :class="isLinkActive(link) ? 'bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400' : 'bg-surface-100 dark:bg-surface-800 text-surface-400'"
            >
              <Link2 class="size-4" />
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-sm font-medium text-surface-900 dark:text-surface-100">
              <span
                :class="[getRoleConfig(link.role).bg, getRoleConfig(link.role).color]"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              >
                <component :is="getRoleConfig(link.role).icon" class="size-2.5" />
                {{ getRoleConfig(link.role).label }}
              </span>
              <span v-if="!isLinkActive(link)" class="text-xs text-danger-500">Inactive</span>
            </div>
            <div class="flex items-center gap-3 text-xs text-surface-400 dark:text-surface-500 mt-0.5">
              <span>{{ link.useCount }}{{ link.maxUses ? `/${link.maxUses}` : '' }} uses</span>
              <span :class="isExpired(link.expiresAt) ? 'text-danger-500' : ''">
                {{ formatExpiresAt(link.expiresAt) }}
              </span>
              <span v-if="link.createdByName">by {{ link.createdByName }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              v-if="isLinkActive(link)"
              class="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              :title="copiedLinkId === link.id ? 'Copied!' : 'Copy invite link'"
              @click="copyLinkToClipboard(link)"
            >
              <Check v-if="copiedLinkId === link.id" class="size-3 text-success-500" />
              <Copy v-else class="size-3" />
              {{ copiedLinkId === link.id ? 'Copied' : 'Copy' }}
            </button>
            <button
              :disabled="revokingLinkId === link.id"
              class="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 dark:border-danger-800 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Revoke invite link"
              @click="handleRevokeLink(link.id)"
            >
              <Loader2 v-if="revokingLinkId === link.id" class="size-3 animate-spin" />
              <Trash2 v-else class="size-3" />
              Revoke
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Join requests section -->
    <section v-if="canInvite && (isLoadingJoinRequests || joinRequests.length > 0)" class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-6 py-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-8 rounded-lg bg-warning-50 dark:bg-warning-950 text-warning-600 dark:text-warning-400">
            <UserCheck class="size-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Join requests</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              {{ isLoadingJoinRequests ? 'Loading…' : `${joinRequests.length} pending request${joinRequests.length !== 1 ? 's' : ''}` }}
            </p>
          </div>
        </div>
      </div>

      <!-- Join request action error -->
      <div v-if="joinRequestActionError" class="px-6 py-2 flex items-center justify-between text-sm text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-950/40 border-b border-danger-200 dark:border-danger-900">
        <span>{{ joinRequestActionError }}</span>
        <button class="text-danger-500 hover:text-danger-700 transition-colors" @click="joinRequestActionError = ''">
          <X class="size-4" />
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingJoinRequests" class="px-6 py-6 text-center text-surface-400 text-sm">
        <Loader2 class="size-4 animate-spin mx-auto mb-1.5" />
        Loading join requests…
      </div>

      <!-- Error state -->
      <div v-else-if="joinRequestsError" class="px-6 py-6 text-center">
        <AlertTriangle class="size-5 text-danger-400 mx-auto mb-1.5" />
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ joinRequestsError }}</p>
        <button class="mt-1.5 text-sm text-brand-600 hover:text-brand-700 underline" @click="fetchJoinRequests">
          Retry
        </button>
      </div>

      <!-- Requests list -->
      <div v-else class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
          v-for="req in joinRequests"
          :key="req.id"
          class="px-6 py-3.5 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
        >
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="req.userImage"
              :src="req.userImage"
              :alt="req.userName"
              class="size-9 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800"
            />
            <div v-else class="size-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300 ring-2 ring-surface-100 dark:ring-surface-800">
              {{ req.userName?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?' }}
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
              {{ req.userName }}
            </div>
            <div class="text-xs text-surface-500 dark:text-surface-400 truncate">
              {{ req.userEmail }}
            </div>
            <div v-if="req.message" class="mt-1 text-xs text-surface-500 dark:text-surface-400 italic flex items-start gap-1">
              <MessageSquare class="size-3 mt-0.5 flex-shrink-0" />
              <span class="truncate">"{{ req.message }}"</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              :disabled="approvingRequestId === req.id"
              class="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Approve — adds as Member"
              @click="handleApproveRequest(req.id)"
            >
              <Loader2 v-if="approvingRequestId === req.id" class="size-3 animate-spin" />
              <UserCheck v-else class="size-3" />
              Approve
            </button>
            <button
              :disabled="rejectingRequestId === req.id"
              class="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 dark:border-danger-800 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reject join request"
              @click="handleRejectRequest(req.id)"
            >
              <Loader2 v-if="rejectingRequestId === req.id" class="size-3 animate-spin" />
              <UserX v-else class="size-3" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Members list -->
    <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center size-10 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Users class="size-5" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">Team members</h2>
              <p class="text-sm text-surface-500 dark:text-surface-400">
                {{ isLoadingMembers ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}` }}
              </p>
            </div>
          </div>
          <div v-if="!isLoadingMembers && members.length > 5" class="flex-shrink-0">
            <input
              v-model="memberSearch"
              type="text"
              placeholder="Search members…"
              class="w-48 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingMembers" class="px-6 py-8 text-center text-surface-400 text-sm">
        <Loader2 class="size-5 animate-spin mx-auto mb-2" />
        Loading members…
      </div>

      <!-- Error state -->
      <div v-else-if="membersError" class="px-6 py-8 text-center">
        <AlertTriangle class="size-6 text-danger-400 mx-auto mb-2" />
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ membersError }}</p>
        <button class="mt-2 text-sm text-brand-600 hover:text-brand-700 underline" @click="fetchMembers">
          Retry
        </button>
      </div>

      <!-- Members list -->
      <div v-else class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
          v-for="m in visibleMembers"
          :key="m.id"
          class="px-6 py-4 flex items-center gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
        >
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <img
              v-if="m.user.image"
              :src="m.user.image"
              :alt="m.user.name"
              class="size-10 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800"
            />
            <div v-else class="size-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-300 ring-2 ring-surface-100 dark:ring-surface-800">
              {{ getInitials(m.user.name) }}
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                {{ m.user.name }}
              </span>
              <span v-if="isCurrentUser(m.userId)" class="text-xs text-surface-400 dark:text-surface-500">(you)</span>
            </div>
            <div class="text-sm text-surface-500 dark:text-surface-400 truncate">
              {{ m.user.email }}
            </div>
          </div>

          <!-- Role badge -->
          <div class="flex-shrink-0">
            <span
              :class="[getRoleConfig(m.role).bg, getRoleConfig(m.role).color]"
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <component :is="getRoleConfig(m.role).icon" class="size-3" />
              {{ getRoleConfig(m.role).label }}
            </span>
          </div>

          <!-- Actions dropdown -->
          <div v-if="canManageMembers && !isCurrentUser(m.userId) && m.role !== 'owner'" class="flex-shrink-0 relative" data-member-actions>
            <button
              class="p-1.5 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              @click.stop="toggleDropdown(m.id)"
            >
              <MoreHorizontal class="size-4" />
            </button>

            <Transition
              enter-active-class="transition-all duration-150"
              leave-active-class="transition-all duration-100"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="activeDropdown === m.id"
                class="absolute right-0 top-full mt-1 w-48 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg z-50 overflow-hidden"
              >
                <!-- Role options -->
                <div class="py-1 border-b border-surface-100 dark:border-surface-800">
                  <div class="px-3 py-1.5 text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                    Change role
                  </div>
                  <button
                    v-if="m.role !== 'admin'"
                    :disabled="isUpdatingRole === m.id"
                    class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center gap-2 disabled:opacity-50 bg-transparent border-0 cursor-pointer"
                    @click="handleUpdateRole(m.id, 'admin')"
                  >
                    <ShieldCheck class="size-3.5 text-brand-500" />
                    Make admin
                  </button>
                  <button
                    v-if="m.role !== 'member'"
                    :disabled="isUpdatingRole === m.id"
                    class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center gap-2 disabled:opacity-50 bg-transparent border-0 cursor-pointer"
                    @click="handleUpdateRole(m.id, 'member')"
                  >
                    <Shield class="size-3.5 text-surface-400" />
                    Make member
                  </button>
                </div>

                <!-- Remove -->
                <div class="py-1">
                  <button
                    class="w-full px-3 py-2 text-left text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors flex items-center gap-2 bg-transparent border-0 cursor-pointer"
                    @click="memberToRemove = { id: m.id, name: m.user.name }; closeDropdown()"
                  >
                    <Trash2 class="size-3.5" />
                    Remove member
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Loading indicator for role update -->
          <div v-if="isUpdatingRole === m.id" class="flex-shrink-0">
            <Loader2 class="size-4 animate-spin text-brand-500" />
          </div>
        </div>

        <!-- Show more button -->
        <div v-if="hasMoreMembers" class="px-6 py-3 text-center border-t border-surface-100 dark:border-surface-800">
          <button
            class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            @click="showMoreMembers"
          >
            Show {{ Math.min(membersPerPage, filteredMembers.length - visibleCount) }} more
            ({{ filteredMembers.length - visibleCount }} remaining)
          </button>
        </div>
      </div>
    </section>

    <!-- Remove member confirmation modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="memberToRemove" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="memberToRemove = null">
          <Transition
            enter-active-class="transition-all duration-200"
            leave-active-class="transition-all duration-150"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="memberToRemove" class="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="flex items-center justify-center size-10 rounded-full bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400">
                  <AlertTriangle class="size-5" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">Remove member</h3>
                  <p class="text-sm text-surface-500 dark:text-surface-400">This action can be undone by re-inviting.</p>
                </div>
              </div>

              <p class="text-sm text-surface-600 dark:text-surface-400 mb-5">
                Are you sure you want to remove <strong class="text-surface-900 dark:text-surface-100">{{ memberToRemove.name }}</strong> from
                <strong class="text-surface-900 dark:text-surface-100">{{ activeOrg?.name }}</strong>?
                They will lose access to all organization data immediately.
              </p>

              <div v-if="removeError" class="mb-4 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-3 py-2 text-sm text-danger-700 dark:text-danger-400">
                {{ removeError }}
              </div>

              <div class="flex items-center gap-3 justify-end">
                <button
                  class="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  @click="memberToRemove = null; removeError = ''"
                >
                  Cancel
                </button>
                <button
                  :disabled="isRemoving"
                  class="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="handleRemoveMember"
                >
                  <Loader2 v-if="isRemoving" class="size-4 animate-spin" />
                  <Trash2 v-else class="size-4" />
                  {{ isRemoving ? 'Removing…' : 'Remove' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Permissions notice for members -->
    <div v-if="!canManageMembers" class="mt-6 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800 px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
      You don't have permission to manage team members. Contact an admin or owner to invite new members or change roles.
    </div>
  </div>
</template>
