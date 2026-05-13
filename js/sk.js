import { supabase } from '/js/supabase.js'

  // ── LOAD PROGRAMS ──
  async function loadPrograms() {
    const { data, error } = await supabase
      .from('sk_programs')
      .select('*')
      .order('created_at', { ascending: false })

      console.log("PROGRAMS:", data)

    const grid = document.getElementById('sk-programs-grid')
    if (!grid) return

    if (error || !data?.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#5a6a7a;">No programs available yet.</div>`
      return
    }

    grid.innerHTML = data.map(p => `
      <div class="sk-program-card">
        <div class="sk-program-img ${p.image_url ? '' : 'bg-green-grad'}"
          ${p.image_url ? `style="background:url('${p.image_url}') center/cover no-repeat"` : ''}>
        </div>
        <div class="sk-program-body">
          <h4>${p.title}</h4>
          <p>${p.description}</p>
          <span class="sk-program-status status-active">● ${p.status}</span>
        </div>
      </div>
    `).join('')
  }

  // ── LOAD EVENTS ──
  async function loadEvents() {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('sk_events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(6)

    const list = document.getElementById('sk-events-list')
    if (!list) return

    if (error || !data?.length) {
      list.innerHTML = `<div style="text-align:center;padding:3rem;color:#5a6a7a;">No upcoming events at this time.</div>`
      return
    }

    const fmt12 = t => {
      if (!t) return ''
      const [h, m] = t.split(':')
      const hr = parseInt(h)
      return `${hr > 12 ? hr - 12 : hr || 12}:${m}${hr >= 12 ? 'pm' : 'am'}`
    }

    list.innerHTML = data.map(ev => {
      const d     = new Date(ev.event_date + 'T00:00:00')
      const month = d.toLocaleString('en-PH', { month: 'short' }).toUpperCase()
      const day   = d.getDate()
      const time  = ev.end_time
        ? `${fmt12(ev.start_time)} – ${fmt12(ev.end_time)}`
        : fmt12(ev.start_time)

      return `
        <div class="sk-event-item">
          <div class="sk-event-date">
            <span class="ev-month">${month}</span>
            <span class="ev-day">${day}</span>
          </div>
          <div class="sk-event-divider"></div>
          <div class="sk-event-info">
            <h4>${ev.title}</h4>
            <p>📍 ${ev.location} &nbsp;·&nbsp; ${time}${ev.description ? ' &nbsp;·&nbsp; ' + ev.description : ''}</p>
          </div>
          <span class="sk-event-tag">${ev.tag}</span>
        </div>
      `
    }).join('')
  }

  loadPrograms()
  loadEvents()