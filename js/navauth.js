import { supabase } from '/js/supabase.js'

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
        .single()

      const name    = profile?.first_name || 'User'
      const role    = profile?.role || 'resident'
      const initial = name.charAt(0).toUpperCase()

      navCta.innerHTML = `
        <div class="nav-profile" id="nav-profile-wrap">
          <div class="nav-avatar">${initial}</div>
          <span class="nav-username">${name}</span>
          <div class="nav-profile-dropdown" id="nav-dropdown">
            <a href="${role === 'admin' || role === 'barangay_worker'
              ? '/pages/public/admin/admindashboard.html'
              : '/pages/resident/dashboard.html'}">
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

    } else {
      navCta.innerHTML = `
        <button class="btn btn-ghost" id="navRegisterBtn">Register</button>
        <button class="btn btn-primary" id="navLoginBtn">Login</button>
      `

      navCta.classList.add('ready')

      document.getElementById('navLoginBtn')
        ?.addEventListener('click', () => window.openModal?.('login'))
      document.getElementById('navRegisterBtn')
        ?.addEventListener('click', () => window.openModal?.('register'))
    }

  }, 100)
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar()
})