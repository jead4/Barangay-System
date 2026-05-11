/* ============================================================
   DOCUMENTSTATUS.JS
   Place in: js/documentstatus.js
   ============================================================ */

import { supabase } from '/js/supabase.js'

const notLoggedIn  = document.getElementById('not-logged-in')
const dsContent    = document.getElementById('ds-content')
const dsLoading    = document.getElementById('ds-loading')
const dsEmpty      = document.getElementById('ds-empty')
const dsTableWrap  = document.getElementById('ds-table-wrap')
const dsTableBody  = document.getElementById('ds-table-body')

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute: '2-digit'
  })
}

function getStatusBadge(status) {
  const s = (status || 'pending').toLowerCase()
  return `<span class="status-badge ${s}">${s}</span>`
}

function getDocIcon(type) {
  if (type?.includes('Clearance'))   return '📋'
  if (type?.includes('Residency'))   return '🏠'
  if (type?.includes('Indigency'))   return '📜'
  return '📄'
}

async function loadRequests(userId) {
  const { data: requests, error } = await supabase
    .from('document_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  dsLoading.style.display = 'none'

  if (error || !requests || requests.length === 0) {
    dsEmpty.style.display = 'block'
    return
  }

  // Update stats
  const total    = requests.length
  const pending  = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length
  const rejected = requests.filter(r => r.status === 'rejected').length

  document.getElementById('stat-total').textContent    = total
  document.getElementById('stat-pending').textContent  = pending
  document.getElementById('stat-approved').textContent = approved
  document.getElementById('stat-rejected').textContent = rejected

  // Build table rows
  dsTableBody.innerHTML = requests.map(r => `
    <tr>
      <td>
        <span class="doc-type-badge">
          ${getDocIcon(r.type)} ${r.type || '—'}
        </span>
      </td>
      <td>${r.purpose || '—'}</td>
      <td>${getStatusBadge(r.status)}</td>
      <td class="ds-date">${formatDate(r.created_at)}</td>
    </tr>
  `).join('')

  dsTableWrap.style.display = 'block'
}

async function initPage() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    notLoggedIn.style.display = 'block'
    return
  }

  dsContent.style.display = 'block'
  await loadRequests(session.user.id)
}

document.addEventListener('DOMContentLoaded', initPage)