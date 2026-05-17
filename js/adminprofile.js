import { supabase } from '/js/supabase.js'

const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') window.location.href = '/index.html'

document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

// ── LOAD PROFILE ──
async function loadProfile() {
  const { data: profile, error } = await supabase
    .from('user')
    .select('first_name, last_name, email, contact_number')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile) return

  const initial  = (profile.first_name || 'A')[0].toUpperCase()
  const fullname = `${profile.first_name} ${profile.last_name}`

  document.getElementById('profile-avatar-lg').textContent = initial
  document.getElementById('profile-fullname').textContent  = fullname
  document.getElementById('pf-firstname').textContent      = profile.first_name || '—'
  document.getElementById('pf-lastname').textContent       = profile.last_name  || '—'
  document.getElementById('pf-email').textContent          = profile.email       || '—'
  document.getElementById('pf-contact').textContent        = profile.contact_number || '—'
}

// ── CHANGE PASSWORD ──
window.changePassword = async () => {
  const newPw     = document.getElementById('new-password').value
  const confirmPw = document.getElementById('confirm-password').value
  const msgEl     = document.getElementById('pw-message')
  const btn       = document.getElementById('pw-btn')

  msgEl.style.color = '#dc2626'
  msgEl.textContent = ''

  if (!newPw || !confirmPw) {
    msgEl.textContent = 'Please fill in both fields.'
    return
  }
  if (newPw.length < 8) {
    msgEl.textContent = 'Password must be at least 8 characters.'
    return
  }
  if (newPw !== confirmPw) {
    msgEl.textContent = 'Passwords do not match.'
    return
  }

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
  document.getElementById('new-password').value     = ''
  document.getElementById('confirm-password').value = ''
  btn.disabled    = false
  btn.textContent = 'Update Password'
}

// ── SIDEBAR / LOGOUT ──
window.logout = async () => {
  await supabase.auth.signOut()
  localStorage.clear()
  window.location.href = '/index.html'
}
window.toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('open')
}

document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open')
    }
  })
})

loadProfile()
