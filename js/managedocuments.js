/* ============================================================
   MANAGEDOCUMENTS.JS
   Place in: js/admin/managedocuments.js
   Table: document_requests (columns: user_id, type, purpose, status)
   ============================================================ */
import { supabase } from '/js/supabase.js'

const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') window.location.href = '/index.html'

document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

let allRequests  = []
let usersMap     = {}
let currentFilter = 'all'

// ── LOAD ALL REQUESTS ──
async function loadRequests() {
  // Fetch all document requests
  const { data: requests, error } = await supabase
    .from('document_requests')
    .select('id, user_id, type, purpose, status, approved_by, created_at')
    .order('created_at', { ascending: false })

  if (error) { console.error('Requests error:', error.message); return }
  allRequests = requests || []

  // Fetch all user names separately
  const userIds = [...new Set(allRequests.map(r => r.user_id).filter(Boolean))]
  if (userIds.length) {
    const { data: users } = await supabase
      .from('user')
      .select('id, first_name, last_name, contact_number')
      .in('id', userIds)

    if (users) users.forEach(u => { usersMap[u.id] = u })
  }

  // Update stat counters
  document.getElementById('count-pending').textContent  = allRequests.filter(r => r.status === 'pending').length
  document.getElementById('count-approved').textContent = allRequests.filter(r => r.status === 'approved').length
  document.getElementById('count-released').textContent = allRequests.filter(r => r.status === 'released').length
  document.getElementById('count-rejected').textContent = allRequests.filter(r => r.status === 'rejected').length

  render()
}

// ── RENDER TABLE ──
function render() {
  const list  = currentFilter === 'all' ? allRequests : allRequests.filter(r => r.status === currentFilter)
  const tbody = document.getElementById('docs-tbody')

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No ${currentFilter === 'all' ? '' : currentFilter} requests found.</td></tr>`
    return
  }

  tbody.innerHTML = list.map(r => {
    const u    = usersMap[r.user_id]
    const name = u ? `${u.first_name} ${u.last_name}` : '—'
    const date = new Date(r.created_at).toLocaleDateString('en-PH')
    return `
      <tr>
        <td><strong>${name}</strong></td>
        <td>${r.type || '—'}</td>
        <td>${r.purpose || '—'}</td>
        <td><span class="status-badge status-${r.status}">${r.status}</span></td>
        <td>${date}</td>
        <td>
          <div class="table-actions">
            <button class="btn-table-view" onclick="viewRequest('${r.id}')">View</button>
          </div>
        </td>
      </tr>`
  }).join('')
}

// ── FILTER ──
window.filterDocs = (status, el) => {
  currentFilter = status
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
  render()
}

// ── VIEW REQUEST ──
window.viewRequest = (id) => {
  const r = allRequests.find(r => r.id === id)
  if (!r) return

  const u    = usersMap[r.user_id]
  const name = u ? `${u.first_name} ${u.last_name}` : '—'

  document.getElementById('doc-id').value          = r.id
  document.getElementById('doc-resident').textContent = name
  document.getElementById('doc-type').textContent     = r.type || '—'
  document.getElementById('doc-purpose').textContent  = r.purpose || '—'
  document.getElementById('doc-contact').textContent  = u?.contact_number || '—'
  document.getElementById('doc-date').textContent     = new Date(r.created_at).toLocaleDateString('en-PH')
  document.getElementById('doc-status').innerHTML     = `<span class="status-badge status-${r.status}">${r.status}</span>`
  document.getElementById('doc-new-status').value     = r.status
  document.getElementById('doc-remarks').value        = ''
  document.getElementById('doc-error').textContent    = ''

  document.getElementById('doc-modal').classList.add('open')
}

window.closeDocModal = () => {
  document.getElementById('doc-modal').classList.remove('open')
}

// ── SAVE STATUS ──
window.saveDocStatus = async () => {
  const id        = document.getElementById('doc-id').value
  const newStatus = document.getElementById('doc-new-status').value
  const remarks   = document.getElementById('doc-remarks').value.trim()
  const errorEl   = document.getElementById('doc-error')
  errorEl.textContent = ''

  const updateData = {
    status:       newStatus,
    approved_by:  user.id,
  }

  const { error } = await supabase
    .from('document_requests')
    .update(updateData)
    .eq('id', id)

  if (error) { errorEl.textContent = error.message; return }

  closeDocModal()
  loadRequests()
}

// ── DELETE REQUEST (custom modal) ──
window.deleteDocRequest = () => {
  const id   = document.getElementById('doc-id').value
  const name = document.getElementById('doc-resident').textContent
  document.getElementById('confirm-delete-name').textContent = name
  document.getElementById('delete-pending-id').value = id
  document.getElementById('delete-confirm-modal').classList.add('open')
}

window.closeDeleteConfirm = () => {
  document.getElementById('delete-confirm-modal').classList.remove('open')
}

window.confirmDelete = async () => {
  const id      = document.getElementById('delete-pending-id').value
  const errorEl = document.getElementById('doc-error')

  const { error } = await supabase
    .from('document_requests')
    .delete()
    .eq('id', id)

  if (error) {
    closeDeleteConfirm()
    errorEl.textContent = error.message
    return
  }

  closeDeleteConfirm()
  closeDocModal()
  loadRequests()
}

// ── SIDEBAR / LOGOUT ──
window.logout        = async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/index.html' }
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('open')

document.getElementById('delete-confirm-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('delete-confirm-modal')) closeDeleteConfirm()
})

document.getElementById('doc-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('doc-modal')) closeDocModal()
})

loadRequests()