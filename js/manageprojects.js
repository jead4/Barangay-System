// ── IMAGE UPLOAD — PROJECTS ──
let projectImgFile = null

window.previewProjectImg = (input) => {
  const file = input.files[0]
  if (!file) return
  projectImgFile = file

  const reader = new FileReader()
  reader.onload = (e) => {
    const preview = document.getElementById('project-img-preview')
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`
    document.getElementById('project-img-clear').style.display = 'inline-flex'
  }
  reader.readAsDataURL(file)
}

window.clearProjectImg = () => {
  projectImgFile = null
  document.getElementById('project-img-preview').innerHTML = '<span class="img-preview-placeholder">📷 No image selected</span>'
  document.getElementById('project-img-file').value = ''
  document.getElementById('project-img-clear').style.display = 'none'
  document.getElementById('project-image').value = ''
}

async function uploadProjectImg() {
  if (!projectImgFile) return document.getElementById('project-image').value || null

  const ext      = projectImgFile.name.split('.').pop()
  const fileName = `projects/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, projectImgFile, { upsert: true })

  if (error) { console.error('Upload error:', error.message); return null }

  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
  return urlData.publicUrl
}
/* ============================================================
   MANAGEPROJECTS.JS — Projects Management
   Place in: js/admin/manageprojects.js
   ============================================================ */
import { supabase } from '/js/supabase.js'

const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') window.location.href = '/index.html'

document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

let currentFilter = 'all'

// ── LOAD PROJECTS ──
async function loadProjects() {
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false })
  if (currentFilter !== 'all') query = query.eq('status', currentFilter)

  const { data, error } = await query
  const tbody = document.getElementById('projects-tbody')

  if (error) {
    console.error('Projects error:', error.message)
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Error: ${error.message}</td></tr>`
    return
  }

  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No projects yet. Click "+ Add Project" to create one.</td></tr>`
    return
  }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>
        <strong>${p.title}</strong><br>
        <small style="color:#5a6a7a;font-size:0.78rem;">${(p.description||'').substring(0,70)}...</small>
      </td>
      <td>${p.location || '—'}</td>
      <td>
        <div class="progress-wrap">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${p.progress}%"></div>
          </div>
          <span class="progress-text">${p.progress}%</span>
        </div>
      </td>
      <td><span class="status-badge status-${p.status}">${p.status}</span></td>
      <td>${p.budget ? '₱' + Number(p.budget).toLocaleString() : '—'}</td>
      <td>
        <div class="table-actions">
          <button class="btn-table-edit"   onclick="editProject('${p.id}')">Edit</button>
          <button class="btn-table-delete" onclick="deleteProject('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('')
}

// ── FILTER ──
window.filterProjects = (status, el) => {
  currentFilter = status
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
  loadProjects()
}

// ── OPEN MODAL ──
window.openProjectModal = () => {
  document.getElementById('project-modal-title').textContent = 'Add Project'
  document.getElementById('project-form').reset()
  document.getElementById('project-id').value = ''
  document.getElementById('project-progress').value = 0
  document.getElementById('project-error').textContent = ''
  clearProjectImg()
  projectImgFile = null
  document.getElementById('project-modal').classList.add('open')
}

window.closeProjectModal = () => {
  document.getElementById('project-modal').classList.remove('open')
}

// ── EDIT ──
window.editProject = async (id) => {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).single()
  if (error || !data) return

  document.getElementById('project-modal-title').textContent = 'Edit Project'
  document.getElementById('project-id').value          = data.id
  document.getElementById('project-title').value       = data.title
  document.getElementById('project-description').value = data.description
  document.getElementById('project-location').value    = data.location || ''
  document.getElementById('project-status').value      = data.status
  document.getElementById('project-budget').value      = data.budget || ''
  document.getElementById('project-progress').value    = data.progress || 0
  document.getElementById('project-start').value       = data.start_date || ''
  document.getElementById('project-end').value         = data.end_date || ''
  document.getElementById('project-image').value = data.image_url || ''
  projectImgFile = null
  const editPreview = document.getElementById('project-img-preview')
  if (data.image_url) {
    editPreview.innerHTML = `<img src="${data.image_url}" alt="Current image">`
    document.getElementById('project-img-clear').style.display = 'inline-flex'
  } else {
    editPreview.innerHTML = '<span class="img-preview-placeholder">📷 No image selected</span>'
    document.getElementById('project-img-clear').style.display = 'none'
  }
  document.getElementById('project-modal').classList.add('open')
}

// ── DELETE ──
window.deleteProject = (id) => {
  showDeleteConfirm('Are you sure you want to delete this project?', async () => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    loadProjects()
  })
}

// ── SAVE FORM ──
document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('project-error')
  const btn     = e.target.querySelector('button[type="submit"]')
  errorEl.textContent = ''
  btn.disabled = true
  btn.textContent = 'Saving...'

  const id = document.getElementById('project-id').value

  btn.textContent = projectImgFile ? 'Uploading image...' : 'Saving...'
  const imageUrl = await uploadProjectImg()

  const payload = {
    title:       document.getElementById('project-title').value.trim(),
    description: document.getElementById('project-description').value.trim(),
    location:    document.getElementById('project-location').value.trim() || null,
    status:      document.getElementById('project-status').value,
    budget:      document.getElementById('project-budget').value || null,
    progress:    parseInt(document.getElementById('project-progress').value) || 0,
    start_date:  document.getElementById('project-start').value || null,
    end_date:    document.getElementById('project-end').value || null,
    image_url:   imageUrl,
    author_id:   user.id,
    updated_at:  new Date().toISOString()
  }

  const { error } = id
    ? await supabase.from('projects').update(payload).eq('id', id)
    : await supabase.from('projects').insert(payload)

  btn.disabled = false
  btn.textContent = 'Save Project'

  if (error) { errorEl.textContent = error.message; return }
  closeProjectModal()
  loadProjects()
})

document.getElementById('project-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('project-modal')) closeProjectModal()
})

window.logout = async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/index.html' }
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

loadProjects()


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