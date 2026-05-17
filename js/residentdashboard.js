import { supabase } from '/js/supabase.js'

// ── AUTH CHECK ──
const { data: { session } } = await supabase.auth.getSession()
if (!session) { window.location.href = '/index.html' }

const { data: profile } = await supabase
  .from('user')
  .select('*')
  .eq('id', session.user.id)
  .maybeSingle()

if (!profile || profile.role === 'admin' || profile.role === 'barangay_worker') {
  window.location.href = '/index.html'
}

// ── POPULATE SIDEBAR & WELCOME ──
const initial = (profile.first_name || 'R')[0].toUpperCase()
document.getElementById('dash-avatar').textContent    = initial
document.getElementById('dash-name').textContent      = `${profile.first_name} ${profile.last_name}`
document.getElementById('welcome-name').textContent   = profile.first_name || 'Resident'

// ── SECTION SWITCHING ──
window.switchSection = (name) => {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'))
  document.querySelectorAll('.dash-nav-item').forEach(a => a.classList.remove('active'))
  document.getElementById(`section-${name}`)?.classList.add('active')
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active')
}

document.querySelectorAll('.dash-nav-item').forEach(link => {
  link.addEventListener('click', (e) => {
    const section = link.dataset.section
    if (!section || link.classList.contains('coming')) return
    e.preventDefault()
    switchSection(section)
  })
})

// ── LOAD DOCUMENT REQUESTS ──
async function loadDocuments() {
  const { data: requests, error } = await supabase
    .from('document_requests')
    .select('id, type, purpose, status, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) { console.error(error.message); return }
  const docs = requests || []

  // Stats
  document.getElementById('ov-total').textContent    = docs.length
  document.getElementById('ov-pending').textContent  = docs.filter(d => d.status === 'pending').length
  document.getElementById('ov-approved').textContent = docs.filter(d => d.status === 'approved' || d.status === 'released').length
  document.getElementById('ov-rejected').textContent = docs.filter(d => d.status === 'rejected').length

  // Recent list (overview section — latest 3)
  const recentEl = document.getElementById('recent-list')
  if (!docs.length) {
    recentEl.innerHTML = `<p style="color:var(--gray);font-size:0.875rem;padding:1rem 0">No document requests yet. <a href="/pages/public/resident/requestdocument.html" style="color:var(--gold)">Request one now →</a></p>`
  } else {
    recentEl.innerHTML = docs.slice(0, 3).map(d => docCard(d)).join('')
  }

  // Full doc list (documents section)
  const docListEl = document.getElementById('doc-list')
  if (!docs.length) {
    docListEl.innerHTML = `<p style="color:var(--gray);font-size:0.875rem;padding:1rem 0">No document requests yet.</p>`
  } else {
    docListEl.innerHTML = docs.map(d => docCard(d)).join('')
  }
}

function docCard(d) {
  const date = new Date(d.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  return `
    <div class="request-card">
      <div class="request-card-left">
        <div class="request-card-icon">📄</div>
        <div class="request-card-info">
          <strong>${d.type || '—'}</strong>
          <span>${d.purpose || '—'}</span>
        </div>
      </div>
      <div class="request-card-right">
        <span class="request-date">${date}</span>
        <span class="status-badge status-${d.status}">${d.status}</span>
      </div>
    </div>`
}

// ── LOAD PROFILE ──
function loadProfile() {
  const initial = (profile.first_name || 'R')[0].toUpperCase()
  document.getElementById('profile-avatar-lg').textContent = initial

  const fields = [
    { label: 'First Name',      value: profile.first_name },
    { label: 'Last Name',       value: profile.last_name },
    { label: 'Email',           value: profile.email },
    { label: 'Contact Number',  value: profile.contact_number },
    { label: 'Sitio / Purok',   value: profile.sitio },
    { label: 'Address',         value: profile.address },
    { label: 'Date of Birth',   value: profile.birthdate ? new Date(profile.birthdate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
    { label: 'Role',            value: profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : null },
  ]

  document.getElementById('profile-fields').innerHTML = `
    <div class="profile-name-header">
      <h2>${profile.first_name} ${profile.last_name}</h2>
      <span class="profile-role-badge">${profile.role || 'Resident'}</span>
    </div>
    <div class="profile-fields-grid">
      ${fields.map(f => `
        <div class="profile-field">
          <span class="profile-field-label">${f.label}</span>
          <span class="profile-field-value">${f.value || '—'}</span>
        </div>
      `).join('')}
    </div>
  `
}

// ── CHANGE PASSWORD ──
window.changeResidentPassword = async () => {
  const newPw     = document.getElementById('res-new-password').value
  const confirmPw = document.getElementById('res-confirm-password').value
  const msgEl     = document.getElementById('res-pw-message')
  const btn       = document.getElementById('res-pw-btn')

  msgEl.style.color = '#dc2626'
  msgEl.textContent = ''

  if (!newPw || !confirmPw) { msgEl.textContent = 'Please fill in both fields.'; return }
  if (newPw.length < 8)     { msgEl.textContent = 'Password must be at least 8 characters.'; return }
  if (newPw !== confirmPw)  { msgEl.textContent = 'Passwords do not match.'; return }

  btn.disabled    = true
  btn.textContent = 'Updating...'

  const { error } = await supabase.auth.updateUser({ password: newPw })

  if (error) {
    msgEl.textContent = error.message
    btn.disabled    = false
    btn.textContent = 'Update Password'
    return
  }

  msgEl.style.color = '#2a9d6b'
  msgEl.textContent = '✓ Password updated successfully.'
  document.getElementById('res-new-password').value     = ''
  document.getElementById('res-confirm-password').value = ''
  btn.disabled    = false
  btn.textContent = 'Update Password'
}

// ── INIT ──
loadDocuments()
loadProfile()
