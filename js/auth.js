/* ============================================================
   AUTH.JS — Supabase Login & Register with Role Redirect
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
  // Close current modal
  const closeEl = document.getElementById(closeId)
  if (closeEl) {
    closeEl.classList.remove('open')
    document.body.style.overflow = ''
  }
  // Open next modal after short delay
  setTimeout(() => {
    const openEl = document.getElementById(openId)
    if (openEl) {
      openEl.classList.add('open')
      document.body.style.overflow = 'hidden'
    } else {
      console.error('Modal not found:', openId)
    }
  }, 280)
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

// ── REDIRECT BASED ON ROLE ──
function redirectByRole(role) {
  console.log('Redirecting for role:', role) // debug

  if (role === 'admin') {
    window.location.href = '/pages/public/admin/admindashboard.html'
  } else {
    window.location.href = '/pages/public/resident/dashboard.html'
  }
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
        <a href="${role === 'admin'
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

// ── RENDER AUTH BUTTONS ──
function renderAuthButtons() {
  const navCta = document.querySelector('.nav-cta')
  if (!navCta) return

  navCta.innerHTML = `
    <button class="btn btn-ghost" id="navRegisterBtn">Register</button>
    <button class="btn btn-primary" id="navLoginBtn">Login</button>
  `
  navCta.classList.add('ready')

  document.getElementById('navLoginBtn')
    ?.addEventListener('click', () => window.openModal('login'))
  document.getElementById('navRegisterBtn')
    ?.addEventListener('click', () => window.openModal('register'))
}

// ── UPDATE NAVBAR ──
async function updateNavbar() {
  const { data: { session } } = await supabase.auth.getSession()

  const interval = setInterval(() => {
    const navCta = document.querySelector('.nav-cta')
    if (!navCta) return
    clearInterval(interval)

    if (session) {
      supabase
        .from('user')
        .select('first_name, role')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          const name = profile?.first_name || 'User'
          const role = profile?.role || 'resident'
          renderProfile(name, role)
        })
    } else {
      renderAuthButtons()
    }
  }, 100)
}


// ── REGISTER PASSWORD STRENGTH ──
window.checkRegStrength = (val) => {
  const bar   = document.getElementById('reg-strength-bar')
  const label = document.getElementById('reg-strength-label')
  const reqs  = document.getElementById('reg-strength-reqs')
  if (!bar) return

  const hasLength  = val.length >= 8
  const hasLetter  = /[A-Za-z]/.test(val)
  const hasNumber  = /[0-9]/.test(val)
  const hasSpecial = /[^A-Za-z0-9]/.test(val)

  const score = [hasLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length

  const colors = ['', '#dc2626', '#f97316', '#eab308', '#2a9d6b']
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong ✓']
  const widths  = ['0%', '25%', '50%', '75%', '100%']

  bar.style.width      = val.length ? widths[score] : '0%'
  bar.style.background = colors[score] || ''
  label.textContent    = val.length ? labels[score] : ''
  label.style.color    = colors[score] || ''

  // Show missing requirements
  const missing = []
  if (!hasLength)  missing.push('8+ chars')
  if (!hasLetter)  missing.push('letter')
  if (!hasNumber)  missing.push('number')
  if (!hasSpecial) missing.push('symbol')

  reqs.textContent = val.length && missing.length
    ? 'Missing: ' + missing.join(', ')
    : val.length && score === 4 ? '✓ All requirements met' : ''
  reqs.style.color = score === 4 ? '#2a9d6b' : 'rgba(255,255,255,0.3)'
}

// ── ESCAPE KEY ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeModal('modal-login')
    window.closeModal('modal-register')
  }
})

// ── MAIN ──
function initAuth() {

  updateNavbar()

  // Auto-open modal if redirected from another page
  const params = new URLSearchParams(window.location.search)
  const modal  = params.get('modal')
  if (modal) {
    setTimeout(() => window.openModal(modal), 400)
    history.replaceState(null, '', window.location.pathname)
  }

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

      // Step 1 — Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        errorEl.textContent = 'Invalid email or password. Please try again.'
        btn.disabled    = false
        btn.textContent = 'Login →'
        return
      }

      // Step 2 — Fetch role from your "user" table
      const { data: profile, error: profileError } = await supabase
        .from('user')
        .select('first_name, last_name, role')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (profileError || !profile) {
        errorEl.textContent = 'Could not load your profile. Please try again.'
        btn.disabled    = false
        btn.textContent = 'Login →'
        return
      }

      // Step 2.5 — Check selected role tab matches actual role in DB
      const selectedRole = document.getElementById('login-role').value
      if (selectedRole === 'admin' && profile.role !== 'admin') {
        // Resident trying to log in as admin
        await supabase.auth.signOut()
        errorEl.textContent = '❌ Access denied. You do not have admin privileges.'
        btn.disabled    = false
        btn.textContent = 'Login →'
        return
      }

      // Step 3 — Store user info
      localStorage.setItem('user', JSON.stringify({
        id:         authData.user.id,
        first_name: profile.first_name,
        last_name:  profile.last_name,
        role:       profile.role,
        email:      authData.user.email
      }))

      // Step 4 — Redirect based on role
      window.closeModal('modal-login')
      redirectByRole(profile.role)
    })
  }

  // ── REGISTER FORM ──
  const registerForm = document.getElementById('register-form')
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const firstname  = document.getElementById('reg-firstname').value.trim()
      const lastname   = document.getElementById('reg-lastname').value.trim()
      const email      = document.getElementById('reg-email').value.trim()
      const contact    = document.getElementById('reg-contact').value.trim()
      const birthdate  = document.getElementById('reg-birthdate').value
      const sitio      = document.getElementById('reg-sitio').value
      const password   = document.getElementById('reg-password').value
      const confirm    = document.getElementById('reg-confirm').value
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
      if (!/[A-Za-z]/.test(password)) {
        errorEl.textContent = 'Password must include at least one letter.'
        return
      }
      if (!/[0-9]/.test(password)) {
        errorEl.textContent = 'Password must include at least one number.'
        return
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errorEl.textContent = 'Password must include at least one special character (e.g. @, #, !).'
        return
      }

      btn.disabled    = true
      btn.textContent = 'Checking email...'

      // ── PRE-CHECK: see if email already exists in user table ──
      const { data: existing } = await supabase
        .from('user')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        errorEl.textContent = '❌ This email is already registered. Try logging in instead.'
        btn.disabled    = false
        btn.textContent = 'Create Account'
        return
      }

      btn.textContent = 'Creating account...'

      // Sign up with Supabase Auth
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
        // ── FRIENDLY ERROR MESSAGES ──
        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already been registered') ||
            error.message.toLowerCase().includes('user already exists') ||
            error.message.toLowerCase().includes('email address is already')) {
          errorEl.textContent = '❌ This email is already registered. Try logging in instead.'
        } else if (error.message.toLowerCase().includes('invalid email')) {
          errorEl.textContent = '❌ Please enter a valid email address.'
        } else if (error.message.toLowerCase().includes('rate limit')) {
          errorEl.textContent = '⏳ Too many attempts. Please wait a moment and try again.'
        } else {
          errorEl.textContent = error.message || 'Registration failed. Please try again.'
        }
        btn.disabled    = false
        btn.textContent = 'Create Account'
        return
      }

      // Upsert into "user" table (handles cases where a trigger already created the row)
      const { error: insertError } = await supabase.from('user').upsert({
        id:             data.user.id,
        first_name:     firstname,
        last_name:      lastname,
        email:          email,
        contact_number: contact,
        birthdate:      birthdate || null,
        sitio:          sitio,
        role:           'resident'
      }, { onConflict: 'id' })

      if (insertError) {
        console.error('Upsert error:', insertError)
      }

      errorEl.style.color = '#34d399'
      errorEl.textContent = '✅ Account created! Please check your email to verify, then login.'
      btn.disabled    = false
      btn.textContent = 'Create Account'
      setTimeout(() => window.switchModal('modal-register', 'modal-login'), 2000)
    })
  }


// ── FORGOT PASSWORD FORM ──
const forgotForm = document.getElementById('forgot-form')
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email   = document.getElementById('forgot-email').value.trim()
    const errorEl = document.getElementById('forgot-error')
    const btn     = forgotForm.querySelector('button[type="submit"]')

    errorEl.textContent = ''
    btn.disabled    = true
    btn.textContent = 'Sending...'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/pages/auth/resetpassword.html'
    })

    if (error) {
      errorEl.textContent = error.message || 'Something went wrong. Please try again.'
      btn.disabled    = false
      btn.textContent = 'Send Reset Link →'
      return
    }

    // Show success state
    forgotForm.style.display = 'none'
    document.getElementById('forgot-success').style.display = 'block'

    // Auto close after 5 seconds
    setTimeout(() => {
      window.closeModal('modal-forgot')
      forgotForm.style.display   = 'flex'
      document.getElementById('forgot-success').style.display = 'none'
      forgotForm.reset()
      btn.disabled    = false
      btn.textContent = 'Send Reset Link →'
    }, 5000)
  })
}

}

// Run immediately if DOM is ready, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth)
} else {
  initAuth()
}