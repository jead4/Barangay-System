import { supabase } from '/js/supabase.js'

function showNotifToast(title, message) {
  const existing = document.getElementById('resident-notif-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'resident-notif-toast'
  toast.innerHTML = `
    <div class="rnt-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </div>
    <div class="rnt-body">
      <div class="rnt-title">${title}</div>
      <div class="rnt-msg">${message}</div>
    </div>
    <button class="rnt-close" onclick="this.closest('#resident-notif-toast').remove()">✕</button>
  `
  toast.className = 'resident-notif-toast'
  document.body.appendChild(toast)
  setTimeout(() => toast?.remove(), 6000)
}

let _realtimeReady = false

function setupRealtimeNotifications(userId) {
  if (_realtimeReady) return
  _realtimeReady = true

  supabase
    .channel(`notif-${userId}`)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      showNotifToast(payload.new.title, payload.new.message)
      const badge = document.getElementById('nav-notif-badge')
      if (badge) {
        const current = parseInt(badge.textContent) || 0
        const next    = current + 1
        badge.textContent   = next > 9 ? '9+' : next
        badge.style.display = 'flex'
      }
    })
    .subscribe()
}

async function loadNotifications(userId) {
  const { data: notifs } = await supabase
    .from('notifications')
    .select('id, title, message, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(15)

  if (!notifs) return

  const unread = notifs.filter(n => !n.is_read).length
  const badge  = document.getElementById('nav-notif-badge')
  if (badge) {
    badge.textContent    = unread > 9 ? '9+' : unread
    badge.style.display  = unread > 0 ? 'flex' : 'none'
  }

  const list = document.getElementById('nav-notif-list')
  if (!list) return

  if (!notifs.length) {
    list.innerHTML = '<p class="nav-notif-empty">No notifications yet</p>'
    return
  }

  list.innerHTML = notifs.map(n => `
    <div class="nav-notif-item${n.is_read ? '' : ' unread'}">
      <div class="nav-notif-item-title">${n.title}</div>
      <div class="nav-notif-item-msg">${n.message}</div>
      <div class="nav-notif-item-time">${new Date(n.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  `).join('')
}

function renderProfile(navCta, name, role, userId) {
  const initial = name.charAt(0).toUpperCase()

  const bellHtml = role === 'resident' ? `
    <div class="nav-notif-wrap" id="nav-notif-wrap">
      <button class="nav-notif-btn" id="nav-notif-btn" aria-label="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <span class="nav-notif-badge" id="nav-notif-badge" style="display:none">0</span>
      </button>
      <div class="nav-notif-panel" id="nav-notif-panel">
        <div class="nav-notif-header">
          <span>Notifications</span>
          <button class="nav-notif-mark-all" id="nav-notif-mark-all">Mark all read</button>
        </div>
        <div class="nav-notif-list" id="nav-notif-list">
          <p class="nav-notif-empty">Loading...</p>
        </div>
      </div>
    </div>
  ` : ''

  navCta.innerHTML = bellHtml + `
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
  document.querySelector('.btn-hero-primary')?.remove()

  document.querySelector('.nav-profile').addEventListener('click', (e) => {
    document.getElementById('nav-dropdown').classList.toggle('open')
    document.getElementById('nav-notif-panel')?.classList.remove('open')
    e.stopPropagation()
  })
  document.addEventListener('click', () => {
    document.getElementById('nav-dropdown')?.classList.remove('open')
    document.getElementById('nav-notif-panel')?.classList.remove('open')
  })
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.stopPropagation()
    await supabase.auth.signOut()
    window.location.href = '/index.html'
  })

  if (role === 'resident') {
    loadNotifications(userId)
    setupRealtimeNotifications(userId)

    document.getElementById('nav-notif-btn').addEventListener('click', async (e) => {
      e.stopPropagation()
      const panel  = document.getElementById('nav-notif-panel')
      const isOpen = panel.classList.toggle('open')
      document.getElementById('nav-dropdown').classList.remove('open')

      if (isOpen) {
        await loadNotifications(userId)
        // Mark all as read after rendering so user sees the highlighted state briefly
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false)
        const badge = document.getElementById('nav-notif-badge')
        if (badge) badge.style.display = 'none'
        document.querySelectorAll('.nav-notif-item.unread').forEach(el => el.classList.remove('unread'))
      }
    })

    document.getElementById('nav-notif-mark-all').addEventListener('click', async (e) => {
      e.stopPropagation()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
      document.getElementById('nav-notif-badge').style.display = 'none'
      document.querySelectorAll('.nav-notif-item.unread').forEach(el => el.classList.remove('unread'))
    })
  }
}

function renderAuthButtons(navCta) {
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

function waitForNavCta(callback) {
  const interval = setInterval(() => {
    const navCta = document.querySelector('.nav-cta')
    if (navCta) {
      clearInterval(interval)
      callback(navCta)
    }
  }, 50)
}

document.addEventListener('DOMContentLoaded', () => {
  supabase.auth.onAuthStateChange(async (_event, session) => {
    waitForNavCta(async (navCta) => {
      if (session) {
        const { data: profile } = await supabase
          .from('user')
          .select('first_name, role')
          .eq('id', session.user.id)
          .maybeSingle()

        const name = profile?.first_name || 'User'
        const role = profile?.role || 'resident'
        renderProfile(navCta, name, role, session.user.id)
      } else {
        renderAuthButtons(navCta)
      }
    })
  })
})
