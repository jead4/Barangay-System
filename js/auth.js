/* ============================================================
   AUTH.JS — Supabase Login & Register
   Place in: js/auth.js
   ============================================================ */

import { supabase } from '/js/supabase.js'

// ── MODAL FUNCTIONS ──
window.openModal = function(type) {
  const modal = document.getElementById('modal-' + type)
  if (modal) {
    modal.classList.add('open')
    document.body.style.overflow = 'hidden'
  }
}

window.closeModal = function(id) {
  const modal = document.getElementById(id)
  if (modal) {
    modal.classList.remove('open')
    document.body.style.overflow = ''
    clearErrors()
  }
}

window.closeModalOutside = function(event, id) {
  if (event.target.id === id) window.closeModal(id)
}

window.switchModal = function(closeId, openId) {
  window.closeModal(closeId)
  setTimeout(() => window.openModal(openId), 250)
}

window.switchRole = function(el, role) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'))
  el.classList.add('active')
  const roleInput = document.getElementById('login-role')
  if (roleInput) roleInput.value = role
}

// ── HELPERS ──
function clearErrors() {
  document.querySelectorAll('.modal-error').forEach(el => {
    el.textContent = ''
    el.style.color = '#f87171'
  })
}

// ── RENDER PROFILE IN NAVBAR ──
function renderProfile(name, role) {
  const initial = name.charAt(0).toUpperCase()
  const navCta  = document.querySelector('.nav-cta')
  if (!navCta) return

  navCta.innerHTML = `
    <div class="nav-profile" id="nav-profile-wrap">
      <div class="nav-avatar">${initial}</div>
      <span class="nav-username">${name}</span>
      <div class="nav-profile-dropdown" id="nav-dropdown">
        <a href="${role === 'admin' || role === 'barangay_worker'
          ? '/pages/public/admin/admindashboard.html'
          : '/pages/public/resident/dashboard.html'}">
          My Dashboard
        </a>
        <button id="logoutBtn">Logout</button>
      </div>
    </div>
  `
  navCta.classList.add('ready')

  document.querySelector('.nav-profile').addEventListener('click', (e) => {
    document.getElementById('nav-dropdown').classList.toggle('open')
    e.stopPropagation()
  })

  document.addEventListener('click', () => {
    document.getElementById('nav-dropdown')?.classList.remove('open')
  })

  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.stopPropagation()
    await supabase.auth.signOut()
    window.location.href = '/index.html'
  })
}

// ── RENDER LOGIN/REGISTER BUTTONS ──
function renderAuthButtons() {
  const navCta = document.querySelector('.nav-cta')
  if (!navCta) return

  navCta.innerHTML = `
    <button class="btn btn-ghost" id="navRegisterBtn">Register</button>
    <button class="btn btn-primary" id="navLoginBtn">Login</button>
  `
  navCta.classList.add('ready')

  document.getElementById('navLoginBtn')
    .addEventListener('click', () => window.openModal('login'))
  document.getElementById('navRegisterBtn')
    .addEventListener('click', () => window.openModal('register'))
}

// ── UPDATE NAVBAR BASED ON AUTH STATE ──
async function updateNavbar() {
  const { data: { session } } = await supabase.auth.getSession()

  const interval = setInterval(async () => {
    const navCta = document.querySelector('.nav-cta')
    if (!navCta) return
    clearInterval(interval)

    if (session) {
      const { data: profile } = await supabase
        .from('user')
        .select('first_name, role')
        .eq('id', session.user.id)
        .maybeSingle()

      const name = profile?.first_name || 'User'
      const role = profile?.role || 'resident'

      renderProfile(name, role)
    } else {
      renderAuthButtons()
    }

  }, 100)
}

// ── ESCAPE KEY ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeModal('modal-login')
    window.closeModal('modal-register')
  }
})

// ── MAIN ──
document.addEventListener('DOMContentLoaded', () => {

  updateNavbar()

  // ── LOGIN FORM ──
  const loginForm = document.getElementById('login-form')
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const email    = document.getElementById('login-email').value.trim()
      const password = document.getElementById('login-password').value
      const errorEl  = document.getElementById('login-error')
      const btn      = loginForm.querySelector('button[type="submit"]')

      errorEl.textContent = ''
      btn.disabled    = true
      btn.textContent = 'Logging in...'

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        errorEl.textContent = 'Invalid email or password. Please try again.'
        btn.disabled    = false
        btn.textContent = 'Login →'
        return
      }

      const { data: profile } = await supabase
        .from('user')
        .select('first_name, role')
        .eq('id', data.user.id)
        .maybeSingle()

      const name = profile?.first_name || 'User'
      const role = profile?.role || 'resident'

      window.closeModal('modal-login')
      renderProfile(name, role)
    })
  }

  // ── REGISTER FORM ──
  const registerForm = document.getElementById('register-form')
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const firstname = document.getElementById('reg-firstname').value.trim()
      const lastname  = document.getElementById('reg-lastname').value.trim()
      const email     = document.getElementById('reg-email').value.trim()
      const contact   = document.getElementById('reg-contact').value.trim()
      const sitio     = document.getElementById('reg-sitio').value
      const password  = document.getElementById('reg-password').value
      const confirm   = document.getElementById('reg-confirm').value
      const errorEl   = document.getElementById('register-error')
      const btn       = registerForm.querySelector('button[type="submit"]')

      errorEl.textContent = ''

      if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match.'
        return
      }
      if (password.length < 8) {
        errorEl.textContent = 'Password must be at least 8 characters.'
        return
      }

      btn.disabled    = true
      btn.textContent = 'Creating account...'

      // Create auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name:     firstname,
            last_name:      lastname,
            contact_number: contact,
            sitio:          sitio,
          }
        }
      })

      if (error) {
        errorEl.textContent = error.message || 'Registration failed. Try again.'
        btn.disabled    = false
        btn.textContent = 'Create Account'
        return
      }

      // Success
      errorEl.style.color = '#34d399'
      errorEl.textContent = '✅ Account created! Please check your email to verify.'
      setTimeout(() => window.switchModal('modal-register', 'modal-login'), 1500)
    })
  }

})