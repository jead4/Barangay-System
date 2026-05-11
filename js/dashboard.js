/* ============================================================
   DASHBOARD.JS — Resident Dashboard
   Place in: js/dashboard.js
   ============================================================ */

import { supabase } from '/js/supabase.js'

// ── SECTION SWITCHER ──
window.switchSection = function(name) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.dash-nav-item').forEach(n => n.classList.remove('active'))
  document.getElementById('section-' + name)?.classList.add('active')
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active')
}

// ── HELPERS ──
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function getDocIcon(type) {
  if (type?.includes('Clearance'))  return '📋'
  if (type?.includes('Residency'))  return '🏠'
  if (type?.includes('Indigency'))  return '📜'
  return '📄'
}

function statusBadge(status) {
  const s = (status || 'pending').toLowerCase()
  return `<span class="status-badge ${s}">${s}</span>`
}

function buildRequestCard(r) {
  return `
    <div class="request-card">
      <div class="request-card-left">
        <div class="request-card-icon">${getDocIcon(r.type)}</div>
        <div class="request-card-info">
          <strong>${r.type || 'Document Request'}</strong>
          <span>${r.purpose || '—'}</span>
        </div>
      </div>
      <div class="request-card-right">
        <span class="request-date">${formatDate(r.created_at)}</span>
        ${statusBadge(r.status)}
      </div>
    </div>
  `
}

function buildEmptyState() {
  return `
    <div class="dash-empty">
      <div class="dash-empty-icon">📭</div>
      <h3>No requests yet</h3>
      <p>You haven't submitted any document requests yet.</p>
      <a href="/pages/public/resident/requestdocument.html" class="btn-new">
        Request a Document
      </a>
    </div>
  `
}

// ── MAIN ──
async function initDashboard() {
  // ── Attach nav listeners HERE (inside DOMContentLoaded) so all elements exist ──
  document.querySelectorAll('.dash-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const section = item.dataset.section
      if (section) window.switchSection(section)
    })
  })

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    window.location.href = '/index.html'
    return
  }

  // Get profile
  const { data: profile } = await supabase
    .from('user')
    .select('first_name, last_name, email, contact_number, sitio, role')
    .eq('id', session.user.id)
    .maybeSingle()

  const name    = profile ? `${profile.first_name} ${profile.last_name}` : 'Resident'
  const initial = (profile?.first_name || 'R').charAt(0).toUpperCase()
  const role    = profile?.role || 'resident'

  // Update sidebar profile
  document.getElementById('dash-avatar').textContent        = initial
  document.getElementById('dash-name').textContent          = name
  document.getElementById('dash-role').textContent          = role
  document.getElementById('welcome-name').textContent       = profile?.first_name || 'Resident'
  document.getElementById('profile-avatar-lg').textContent  = initial

  // Load profile fields
  document.getElementById('profile-fields').innerHTML = `
    <div class="profile-field">
      <span class="profile-field-label">Full Name</span>
      <span class="profile-field-value">${name}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">Email</span>
      <span class="profile-field-value">${profile?.email || session.user.email}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">Contact Number</span>
      <span class="profile-field-value">${profile?.contact_number || '—'}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">Sitio / Purok</span>
      <span class="profile-field-value">${profile?.sitio || '—'}</span>
    </div>
    <div class="profile-field">
      <span class="profile-field-label">Role</span>
      <span class="profile-field-value" style="text-transform:capitalize;">${role}</span>
    </div>
  `

  // Load document requests
  const { data: requests } = await supabase
    .from('document_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const reqs = requests || []

  // Update stats
  document.getElementById('ov-total').textContent    = reqs.length
  document.getElementById('ov-pending').textContent  = reqs.filter(r => r.status === 'pending').length
  document.getElementById('ov-approved').textContent = reqs.filter(r => r.status === 'approved').length
  document.getElementById('ov-rejected').textContent = reqs.filter(r => r.status === 'rejected').length

  // Recent requests (overview — show last 3)
  const recentEl = document.getElementById('recent-list')
  recentEl.innerHTML = reqs.length === 0
    ? buildEmptyState()
    : reqs.slice(0, 3).map(buildRequestCard).join('')

  // All requests (documents section)
  const docListEl = document.getElementById('doc-list')
  docListEl.innerHTML = reqs.length === 0
    ? buildEmptyState()
    : reqs.map(buildRequestCard).join('')
}

document.addEventListener('DOMContentLoaded', initDashboard)