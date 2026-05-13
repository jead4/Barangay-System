/* ============================================================
   MANAGERESIDENTS.JS
   Place in: js/admin/manageresidents.js
   ============================================================ */
import { supabase } from '/js/supabase.js'

const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') window.location.href = '/index.html'

document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

let allResidents  = []
let currentSitio  = 'all'
let searchQuery   = ''

// ── LOAD RESIDENTS ──
async function loadResidents() {
  const { data, error } = await supabase
    .from('user')
    .select('id, first_name, last_name, email, contact_number, sitio, role, created_at')
    .eq('role', 'resident')
    .order('created_at', { ascending: false })

  if (error) { console.error(error.message); return }
  allResidents = data || []

  // Stats
  document.getElementById('res-total').textContent    = allResidents.length
  document.getElementById('res-verified').textContent  = allResidents.length
  document.getElementById('res-pending').textContent   = 0

  render()
}

// ── RENDER ──
function render() {
  let list = allResidents

  if (currentSitio !== 'all') {
    list = list.filter(r => r.sitio === currentSitio)
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    list = list.filter(r =>
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    )
  }

  const tbody = document.getElementById('residents-tbody')

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No residents found.</td></tr>`
    return
  }

  tbody.innerHTML = list.map(r => {
    const name    = `${r.first_name || ''} ${r.last_name || ''}`.trim()
    const initial = (r.first_name || '?')[0].toUpperCase()
    const date    = new Date(r.created_at).toLocaleDateString('en-PH')
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2a9d6b,#1a7a4a);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.85rem;flex-shrink:0;">${initial}</div>
            <strong>${name || '—'}</strong>
          </div>
        </td>
        <td>${r.email || '—'}</td>
        <td>${r.contact_number || '—'}</td>
        <td>${r.sitio || '—'}</td>
        <td><span class="status-badge role-${r.role}">${r.role}</span></td>
        <td>${date}</td>
        <td>
          <button class="btn-table-view" onclick="viewResident('${r.id}')">View</button>
        </td>
      </tr>`
  }).join('')
}

// ── FILTER BY SITIO ──
window.filterBySitio = (sitio, el) => {
  currentSitio = sitio
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
  render()
}

// ── SEARCH ──
window.searchResidents = (val) => {
  searchQuery = val
  render()
}

// ── VIEW RESIDENT MODAL ──
window.viewResident = (id) => {
  const r = allResidents.find(r => r.id === id)
  if (!r) return

  const name = `${r.first_name || ''} ${r.last_name || ''}`.trim()

  document.getElementById('res-modal-id').value           = r.id
  document.getElementById('res-modal-avatar').textContent = (r.first_name || '?')[0].toUpperCase()
  document.getElementById('res-modal-name').textContent   = name || '—'
  document.getElementById('res-modal-email').textContent  = r.email || '—'
  document.getElementById('res-modal-contact').textContent = r.contact_number || '—'
  document.getElementById('res-modal-sitio').textContent  = r.sitio || '—'
  document.getElementById('res-modal-date').textContent   = new Date(r.created_at).toLocaleDateString('en-PH')
  document.getElementById('res-modal-role-select').value  = r.role

  const badge = document.getElementById('res-modal-role-badge')
  badge.textContent = r.role
  badge.className   = `status-badge role-${r.role}`

  document.getElementById('res-modal-error').textContent = ''
  document.getElementById('resident-modal').classList.add('open')
}

window.closeResidentModal = () => {
  document.getElementById('resident-modal').classList.remove('open')
}

// ── SAVE ROLE ──
window.saveResidentRole = async () => {
  const id      = document.getElementById('res-modal-id').value
  const newRole = document.getElementById('res-modal-role-select').value
  const errorEl = document.getElementById('res-modal-error')
  errorEl.textContent = ''

  const { error } = await supabase
    .from('user')
    .update({ role: newRole })
    .eq('id', id)

  if (error) { errorEl.textContent = error.message; return }

  closeResidentModal()
  loadResidents()
}

// ── DELETE RESIDENT ──
window.deleteResident = () => {
  const id   = document.getElementById('res-modal-id').value
  const r    = allResidents.find(r => r.id === id)
  const name = `${r?.first_name || ''} ${r?.last_name || ''}`.trim()

  showDeleteConfirm(`Remove ${name} from the system?`, async () => {
    const { error } = await supabase.from('user').delete().eq('id', id)
    if (error) {
      document.getElementById('res-modal-error').textContent = error.message
      return
    }
    closeResidentModal()
    loadResidents()
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

document.getElementById('resident-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('resident-modal')) closeResidentModal()
})

loadResidents()


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