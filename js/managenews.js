/* ============================================================
   MANAGENEWS.JS — News Management
   Place in: js/admin/managenews.js
   ============================================================ */
import { supabase } from '/js/supabase.js'

const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') window.location.href = '/index.html'

document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

let currentFilter = 'all'

// ── LOAD NEWS ──
async function loadNews() {
  let query = supabase.from('news').select('*').order('created_at', { ascending: false })
  if (currentFilter !== 'all') query = query.eq('category', currentFilter)

  const { data, error } = await query
  const tbody = document.getElementById('news-tbody')

  if (error) {
    console.error('News error:', error.message)
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Error loading news: ${error.message}</td></tr>`
    return
  }

  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No news yet. Click "+ Add News" to create one.</td></tr>`
    return
  }

  tbody.innerHTML = data.map(n => `
    <tr>
      <td>
        <strong>${n.title}</strong><br>
        <small style="color:#5a6a7a;font-size:0.78rem;">${n.content.substring(0,90)}...</small>
      </td>
      <td><span class="status-badge status-active">${n.category}</span></td>
      <td>${n.is_featured ? '⭐ Featured' : n.is_alert ? '🔴 Alert' : '—'}</td>
      <td>${new Date(n.created_at).toLocaleDateString('en-PH')}</td>
      <td>
        <div class="table-actions">
          <button class="btn-table-edit"   onclick="editNews('${n.id}')">Edit</button>
          <button class="btn-table-delete" onclick="deleteNews('${n.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('')
}

// ── FILTER ──
window.filterNews = (category, el) => {
  currentFilter = category
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
  loadNews()
}

// ── OPEN MODAL ──
window.openNewsModal = () => {
  document.getElementById('news-modal-title').textContent = 'Add News'
  document.getElementById('news-form').reset()
  document.getElementById('news-id').value = ''
  document.getElementById('news-error').textContent = ''
  document.getElementById('news-modal').classList.add('open')
}

window.closeNewsModal = () => {
  document.getElementById('news-modal').classList.remove('open')
}

// ── EDIT ──
window.editNews = async (id) => {
  const { data, error } = await supabase.from('news').select('*').eq('id', id).single()
  if (error || !data) return

  document.getElementById('news-modal-title').textContent = 'Edit News'
  document.getElementById('news-id').value        = data.id
  document.getElementById('news-title').value     = data.title
  document.getElementById('news-category').value  = data.category
  document.getElementById('news-content').value   = data.content
  document.getElementById('news-image').value     = data.image_url || ''
  document.getElementById('news-featured').checked = data.is_featured
  document.getElementById('news-alert').checked    = data.is_alert
  document.getElementById('news-modal').classList.add('open')
}

// ── DELETE ──
window.deleteNews = (id) => {
  showDeleteConfirm('Are you sure you want to delete this news article?', async () => {
    const { error } = await supabase.from('news').delete().eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    loadNews()
  })
}

// ── SAVE FORM ──
document.getElementById('news-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('news-error')
  const btn     = e.target.querySelector('button[type="submit"]')
  errorEl.textContent = ''
  btn.disabled = true
  btn.textContent = 'Saving...'

  const id      = document.getElementById('news-id').value
  const payload = {
    title:       document.getElementById('news-title').value.trim(),
    category:    document.getElementById('news-category').value,
    content:     document.getElementById('news-content').value.trim(),
    image_url:   document.getElementById('news-image').value.trim() || null,
    is_featured: document.getElementById('news-featured').checked,
    is_alert:    document.getElementById('news-alert').checked,
    author_id:   user.id,
    updated_at:  new Date().toISOString()
  }

  const { error } = id
    ? await supabase.from('news').update(payload).eq('id', id)
    : await supabase.from('news').insert(payload)

  btn.disabled = false
  btn.textContent = 'Save News'

  if (error) { errorEl.textContent = error.message; return }
  closeNewsModal()
  loadNews()
})

document.getElementById('news-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('news-modal')) closeNewsModal()
})

window.logout = async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/index.html' }
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('open')

loadNews()


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

document.addEventListener('DOMContentLoaded', () => {
  const m = document.getElementById('delete-confirm-modal')
  if (m) m.addEventListener('click', e => {
    if (e.target.id === 'delete-confirm-modal') closeDeleteConfirm()
  })
})