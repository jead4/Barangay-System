import { supabase } from '/js/supabase.js'

const notLoggedIn = document.getElementById('not-logged-in')
const requestForm = document.getElementById('request-form')
const formSuccess = document.getElementById('form-success')
const formError   = document.getElementById('form-error')
const submitBtn   = document.getElementById('submit-btn')

async function initPage() {
  // Get session directly
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    notLoggedIn.style.display = 'block'
    requestForm.style.display = 'none'
    return
  }

  // Show form
  notLoggedIn.style.display = 'none'
  requestForm.style.display = 'block'

  // Auto-fill name
  const { data: profile } = await supabase
    .from('user')
    .select('first_name, last_name')
    .eq('id', session.user.id)
    .maybeSingle()

  if (profile) {
    document.getElementById('full-name').value =
      `${profile.first_name} ${profile.last_name}`
  }

  // Submit
  requestForm.onsubmit = async (e) => {
    e.preventDefault()

    const docType = document.querySelector('input[name="doc_type"]:checked')?.value
    const purpose = document.getElementById('purpose').value
    const notes   = document.getElementById('notes').value.trim()

    formError.textContent = ''

    if (!purpose) {
      formError.textContent = 'Please select a purpose.'
      return
    }

    submitBtn.disabled    = true
    submitBtn.textContent = 'Submitting...'

    const { error } = await supabase
      .from('document_requests')
      .insert({
        user_id: session.user.id,
        type:    docType,
        purpose: purpose + (notes ? ` — ${notes}` : ''),
        status:  'pending'
      })

    if (error) {
      formError.textContent = 'Submission failed: ' + error.message
      submitBtn.disabled    = false
      submitBtn.textContent = 'Submit Request →'
      return
    }

    requestForm.style.display = 'none'
    formSuccess.classList.add('show')
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initPage)