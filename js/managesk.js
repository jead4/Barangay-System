/* ============================================================
   MANAGESK.JS — SK Programs & Events Management
   Place in: js/admin/managesk.js
   ============================================================ */
import { supabase } from '/js/supabase.js'

const user = JSON.parse(localStorage.getItem('user'))
if (!user || user.role !== 'admin') window.location.href = '/index.html'

document.getElementById('admin-name').textContent   = user.first_name || 'Admin'
document.getElementById('admin-avatar').textContent = (user.first_name || 'A')[0].toUpperCase()

// ── TAB SWITCHER ──
window.switchTab = (tab, el) => {
  document.querySelectorAll('.sk-tab').forEach(t => t.classList.remove('active'))
  el.classList.add('active')
  document.getElementById('tab-programs').style.display = tab === 'programs' ? 'block' : 'none'
  document.getElementById('tab-events').style.display   = tab === 'events'   ? 'block' : 'none'
}

// ══════════════════════════════════════
// PROGRAMS
// ══════════════════════════════════════

async function loadPrograms() {
  const { data, error } = await supabase
    .from('sk_programs')
    .select('*')
    .order('created_at', { ascending: false })

  const tbody = document.getElementById('programs-tbody')
  if (error) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Error: ${error.message}</td></tr>`; return }
  if (!data?.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No programs yet. Click "+ Add Program".</td></tr>`; return }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td><small style="color:#5a6a7a">${(p.description||'').substring(0,80)}...</small></td>
      <td><span class="status-badge status-${p.status}">● ${p.status}</span></td>
      <td>${new Date(p.created_at).toLocaleDateString('en-PH')}</td>
      <td>
        <div class="table-actions">
          <button class="btn-table-edit"   onclick="editProgram('${p.id}')">Edit</button>
          <button class="btn-table-delete" onclick="deleteProgram('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('')
}

window.openProgramModal = () => {
  document.getElementById('program-modal-title').textContent = 'Add Program'
  document.getElementById('program-form').reset()
  document.getElementById('program-id').value = ''
  document.getElementById('program-error').textContent = ''
  document.getElementById('program-modal').classList.add('open')
}

window.closeProgramModal = () => document.getElementById('program-modal').classList.remove('open')

window.editProgram = async (id) => {
  const { data } = await supabase.from('sk_programs').select('*').eq('id', id).single()
  if (!data) return
  document.getElementById('program-modal-title').textContent = 'Edit Program'
  document.getElementById('program-id').value          = data.id
  document.getElementById('program-title').value       = data.title
  document.getElementById('program-description').value = data.description
  document.getElementById('program-status').value      = data.status
  document.getElementById('program-image').value       = data.image_url || ''
  document.getElementById('program-modal').classList.add('open')
}

window.deleteProgram = (id) => {
  showDeleteConfirm('Are you sure you want to delete this SK program?', async () => {
    await supabase.from('sk_programs').delete().eq('id', id)
    loadPrograms()
  })
}

document.getElementById('program-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('program-error')
  const btn     = e.target.querySelector('button[type="submit"]')
  errorEl.textContent = ''
  btn.disabled = true; btn.textContent = 'Saving...'

  const id      = document.getElementById('program-id').value
  const payload = {
    title:       document.getElementById('program-title').value.trim(),
    description: document.getElementById('program-description').value.trim(),
    status:      document.getElementById('program-status').value,
    image_url:   document.getElementById('program-image').value.trim() || null,
    author_id:   user.id,
    updated_at:  new Date().toISOString()
  }

  const { error } = id
    ? await supabase.from('sk_programs').update(payload).eq('id', id)
    : await supabase.from('sk_programs').insert(payload)

  btn.disabled = false; btn.textContent = 'Save Program'
  if (error) { errorEl.textContent = error.message; return }
  closeProgramModal()
  loadPrograms()
})

// ══════════════════════════════════════
// EVENTS
// ══════════════════════════════════════

async function loadEvents() {
  const { data, error } = await supabase
    .from('sk_events')
    .select('*')
    .order('event_date', { ascending: true })

  const tbody = document.getElementById('events-tbody')
  if (error) { tbody.innerHTML = `<tr><td colspan="6" class="table-empty">Error: ${error.message}</td></tr>`; return }
  if (!data?.length) { tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No events yet. Click "+ Add Event".</td></tr>`; return }

  tbody.innerHTML = data.map(ev => {
    const evDate  = new Date(ev.event_date)
    const month   = evDate.toLocaleString('en-PH', { month: 'short' })
    const day     = evDate.getDate()
    const fmt12   = t => { if (!t) return '—'; const [h,m] = t.split(':'); const hr = +h; return `${hr>12?hr-12:hr||12}:${m}${hr>=12?'pm':'am'}` }
    return `
    <tr>
      <td><strong>${ev.title}</strong></td>
      <td>${ev.location}</td>
      <td>${month} ${day}</td>
      <td>${fmt12(ev.start_time)}${ev.end_time ? ' – ' + fmt12(ev.end_time) : ''}</td>
      <td><span class="status-badge status-active">${ev.tag}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-table-edit"   onclick="editEvent('${ev.id}')">Edit</button>
          <button class="btn-table-delete" onclick="deleteEvent('${ev.id}')">Delete</button>
        </div>
      </td>
    </tr>`
  }).join('')
}

window.openEventModal = () => {
  document.getElementById('event-modal-title').textContent = 'Add Event'
  document.getElementById('event-form').reset()
  document.getElementById('event-id').value = ''
  document.getElementById('event-error').textContent = ''
  document.getElementById('event-modal').classList.add('open')
}

window.closeEventModal = () => document.getElementById('event-modal').classList.remove('open')

window.editEvent = async (id) => {
  const { data } = await supabase.from('sk_events').select('*').eq('id', id).single()
  if (!data) return
  document.getElementById('event-modal-title').textContent = 'Edit Event'
  document.getElementById('event-id').value          = data.id
  document.getElementById('event-title').value       = data.title
  document.getElementById('event-description').value = data.description || ''
  document.getElementById('event-location').value    = data.location
  document.getElementById('event-date').value        = data.event_date
  document.getElementById('event-tag').value         = data.tag
  document.getElementById('event-start-time').value  = data.start_time
  document.getElementById('event-end-time').value    = data.end_time || ''
  document.getElementById('event-modal').classList.add('open')
}

window.deleteEvent = (id) => {
  showDeleteConfirm('Are you sure you want to delete this SK event?', async () => {
    await supabase.from('sk_events').delete().eq('id', id)
    loadEvents()
  })
}

document.getElementById('event-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('event-error')
  const btn     = e.target.querySelector('button[type="submit"]')
  errorEl.textContent = ''
  btn.disabled = true; btn.textContent = 'Saving...'

  const id      = document.getElementById('event-id').value
  const payload = {
    title:       document.getElementById('event-title').value.trim(),
    description: document.getElementById('event-description').value.trim() || null,
    location:    document.getElementById('event-location').value.trim(),
    event_date:  document.getElementById('event-date').value,
    tag:         document.getElementById('event-tag').value,
    start_time:  document.getElementById('event-start-time').value,
    end_time:    document.getElementById('event-end-time').value || null,
    author_id:   user.id
  }

  const { error } = id
    ? await supabase.from('sk_events').update(payload).eq('id', id)
    : await supabase.from('sk_events').insert(payload)

  btn.disabled = false; btn.textContent = 'Save Event'
  if (error) { errorEl.textContent = error.message; return }
  closeEventModal()
  loadEvents()
})

// ── CLOSE ON OUTSIDE CLICK ──
;['program-modal','event-modal','delete-confirm-modal'].forEach(id => {
  const el = document.getElementById(id)
  if (el) el.addEventListener('click', e => {
    if (e.target.id === id) {
      el.classList.remove('open')
      if (id === 'delete-confirm-modal') { _deleteCallback = null }
    }
  })
})

window.logout = async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/index.html' }
window.toggleSidebar = () => document.getElementById('sidebar').classList.toggle('open')

// ── INIT ──
loadPrograms()
loadEvents()


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