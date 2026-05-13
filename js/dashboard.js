/* ============================================================
   DASHBOARD.JS — Admin Dashboard
   Table names: "user", document_requests
   Columns: user_id, type, purpose, status, created_at
   ============================================================ */
import { supabase } from '/js/supabase.js'

// ── AUTH CHECK ──
const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') {
  window.location.href = '/index.html'
}

// ── SET ADMIN NAME & AVATAR ──
document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('topbar-name').textContent  = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

// ── DATE ──
document.getElementById('topbar-date').textContent = new Date().toLocaleDateString('en-PH', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

// ── LOAD STATS ──
async function loadStats() {

  // Total residents
  const { count: residentCount, error: e1 } = await supabase
    .from('user')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'resident')

  if (e1) console.error('Residents error:', e1.message)

  // Pending requests
  const { count: pendingCount, error: e2 } = await supabase
    .from('document_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (e2) console.error('Pending error:', e2.message)

  // News count
  const { count: newsCount, error: e3 } = await supabase
    .from('news')
    .select('*', { count: 'exact', head: true })

  if (e3) console.error('News error:', e3.message)

  // Active projects
  const { count: projectCount, error: e4 } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ongoing')

  if (e4) console.error('Projects error:', e4.message)

  // Update UI
  document.getElementById('stat-residents').textContent = residentCount ?? 0
  document.getElementById('stat-pending').textContent   = pendingCount  ?? 0
  document.getElementById('stat-news').textContent      = newsCount     ?? 0
  document.getElementById('stat-projects').textContent  = projectCount  ?? 0

  // Sidebar pending badge
  const badge = document.getElementById('pending-badge')
  if (badge) badge.textContent = pendingCount ?? 0
}

// ── LOAD RECENT DOCUMENT REQUESTS ──
async function loadRecentRequests() {
  // Step 1 — fetch document requests
  const { data: requests, error } = await supabase
    .from('document_requests')
    .select('id, type, purpose, status, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) console.error('Document requests error:', error.message)

  const tbody = document.getElementById('recent-requests')

  if (error || !requests?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No document requests yet.</td></tr>`
    return
  }

  // Step 2 — fetch user names separately to avoid reserved word join issue
  const userIds = [...new Set(requests.map(r => r.user_id).filter(Boolean))]
  let usersMap = {}

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('user')
      .select('id, first_name, last_name')
      .in('id', userIds)

    if (users) {
      users.forEach(u => { usersMap[u.id] = u })
    }
  }

  tbody.innerHTML = requests.map(r => {
    const u = usersMap[r.user_id]
    const name = u ? `${u.first_name} ${u.last_name}` : '—'
    return `
    <tr>
      <td><strong>${name}</strong></td>
      <td>${r.type ?? '—'}</td>
      <td>${r.purpose ?? '—'}</td>
      <td><span class="status-badge status-${r.status}">${r.status}</span></td>
      <td>${new Date(r.created_at).toLocaleDateString('en-PH')}</td>
      <td><a href="managedocuments.html" class="btn-table-view">View</a></td>
    </tr>`
  }).join('')
}

// ── LOAD RECENT NEWS ──
async function loadRecentNews() {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, category, is_featured, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) console.error('News load error:', error.message)

  const tbody = document.getElementById('recent-news')

  if (error || !data?.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">No news published yet.</td></tr>`
    return
  }

  tbody.innerHTML = data.map(n => `
    <tr>
      <td><strong>${n.title}</strong></td>
      <td><span class="status-badge status-active">${n.category}</span></td>
      <td>${n.is_featured ? '⭐ Yes' : '—'}</td>
      <td>${new Date(n.created_at).toLocaleDateString('en-PH')}</td>
    </tr>
  `).join('')
}

// ── LOGOUT ──
window.logout = async () => {
  await supabase.auth.signOut()
  localStorage.clear()
  window.location.href = '/index.html'
}

// ── SIDEBAR TOGGLE ──
window.toggleSidebar = () => {
  document.getElementById('sidebar').classList.toggle('open')
}

// ── INIT ──
loadStats()
loadRecentRequests()
loadRecentNews()