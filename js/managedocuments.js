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
      .select('id, first_name, last_name, contact_number, email')
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
  const btn       = document.querySelector('#doc-modal .btn-admin-primary')
  errorEl.textContent = ''
  btn.disabled = true
  btn.textContent = 'Saving...'

  const { error } = await supabase
    .from('document_requests')
    .update({ status: newStatus, approved_by: user.id })
    .eq('id', id)

  if (error) {
    errorEl.textContent = error.message
    btn.disabled = false
    btn.textContent = 'Save Changes'
    return
  }

  // ── SEND EMAIL if approved or released ──
  if (['approved', 'released'].includes(newStatus)) {
    const req         = allRequests.find(r => r.id === id)
    const u           = usersMap[req?.user_id]
    const residentEmail = u?.email || null
    const residentName  = u ? `${u.first_name} ${u.last_name}` : 'Resident'
    const docType       = req?.type || 'Document'

    if (residentEmail) {
      try {
        const res = await supabase.functions.invoke('send-document-email', {
          body: {
            resident_email: residentEmail,
            resident_name:  residentName,
            document_type:  docType,
            status:         newStatus,
            remarks:        remarks || null
          }
        })
        console.log('Email sent:', res)
        showEmailToast(residentEmail, newStatus)
      } catch (emailErr) {
        console.warn('Email failed (non-critical):', emailErr)
        showEmailToast(null, newStatus)
      }
    } else {
      showEmailToast(null, newStatus)
    }
  }

  btn.disabled = false
  btn.textContent = 'Save Changes'
  closeDocModal()
  loadRequests()
}

// ── EMAIL TOAST NOTIFICATION ──
function showEmailToast(email, status) {
  const existing = document.getElementById('email-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'email-toast'
  const msg = email
    ? `📧 Email sent to ${email}`
    : `⚠️ No email found — notify resident manually`
  const bg = email ? '#2a9d6b' : '#b45309'

  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    background:${bg}; color:#fff; padding:14px 20px;
    border-radius:12px; font-size:0.875rem; font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,0.2);
    display:flex; align-items:center; gap:10px;
    animation: slideIn 0.3s ease;
    max-width: 360px;
  `
  toast.innerHTML = msg
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}

window.deleteDocRequest = () => {
  const id   = document.getElementById('doc-id').value
  const name = document.getElementById('doc-resident').textContent
  showDeleteConfirm(`Delete the document request for ${name}?`, async () => {
    const { error } = await supabase.from('document_requests').delete().eq('id', id)
    if (error) { document.getElementById('doc-error').textContent = error.message; return }
    closeDocModal()
    loadRequests()
  })
}

// ── SIDEBAR / LOGOUT ──
window.logout        = async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/index.html' }
window.toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('open')
}

// Close sidebar when clicking a link on mobile
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open')
    }
  })
})

document.getElementById('delete-confirm-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('delete-confirm-modal')) closeDeleteConfirm()
})

document.getElementById('doc-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('doc-modal')) closeDocModal()
})

loadRequests()


// ── CUSTOM DELETE CONFIRM MODAL ──
let _deleteCallback = null

window.showDeleteConfirm = (message, callback) => {
  document.getElementById('confirm-delete-message').textContent = message
  _deleteCallback = callback
  document.getElementById('delete-confirm-modal').classList.add('open')
}

window.closeDeleteConfirm = () => {
  document.getElementById('delete-confirm-modal').classList.remove('open')
  _deleteCallback = null
}

window.confirmDeleteAction = async () => {
  if (_deleteCallback) await _deleteCallback()
  closeDeleteConfirm()
}