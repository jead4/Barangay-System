/* ============================================================
   NAVBAR.JS — Loads navbar, handles mobile menu & logo swap
   Place in: js/navbar.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const container = document.getElementById('navbar-container');

  if (container) {
    fetch('/components/navbar.html')
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        initNavbar();
      })
      .catch(err => console.error('Navbar load failed:', err));
  } else {
    initNavbar();
  }

  // Inject auth CSS if not already loaded
  if (!document.querySelector('link[href="/css/auth.css"]')) {
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = '/css/auth.css'
    document.head.appendChild(link)
  }

  // Inject auth modals on every page (if not already present)
  if (!document.getElementById('modal-login')) {
    fetch('/components/auth-modals.html')
      .then(res => res.text())
      .then(html => {
        const div = document.createElement('div')
        div.innerHTML = html
        document.body.appendChild(div)

        // Define modal helpers immediately so buttons work right away
        window.openModal = function(type) {
          const modal = document.getElementById('modal-' + type)
          if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden' }
        }
        window.closeModal = function(id) {
          const modal = document.getElementById(id)
          if (modal) { modal.classList.remove('open'); document.body.style.overflow = '' }
        }
        window.closeModalOutside = function(event, id) {
          if (event.target.id === id) window.closeModal(id)
        }
        window.switchModal = function(closeId, openId) {
          window.closeModal(closeId)
          setTimeout(() => window.openModal(openId), 280)
        }
        window.switchRole = function(el, role) {
          document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'))
          el.classList.add('active')
          const roleInput = document.getElementById('login-role')
          if (roleInput) roleInput.value = role
        }

        // Load auth.js for form submission handlers
        const script = document.createElement('script')
        script.type = 'module'
        script.src  = '/js/auth.js'
        document.body.appendChild(script)
      })
      .catch(err => console.error('Auth modals load failed:', err))
  }

  function initNavbar() {

    // ── LOGO SWAP ──
    const currentPath = window.location.pathname;
    const isSKPage = currentPath.includes('/sk/') || currentPath.includes('sk.html');

    const logo = document.getElementById('nav-logo');
    if (logo) {
      if (isSKPage) {
        logo.src = '/assets/images/sk.jpg';
        logo.alt = 'SK Logo';
      } else {
        logo.src = '/assets/images/logo.png';
        logo.alt = 'Logo';
      }
    }

    // ── ACTIVE LINK ──
    const currentPage = currentPath.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      // Skip the Services dropdown toggle
      if (link.classList.contains('nav-dropdown-toggle')) return

      const linkPath = new URL(link.href).pathname;
      const linkPage = linkPath.split('/').pop();

      if (linkPage === currentPage) {
        link.classList.add('active');
      }

      // Special case: root path = home
      if ((currentPath === '/' || currentPage === 'index.html') && link.getAttribute('href') === '/index.html') {
        link.classList.add('active');
      }
    });

    // ── HAMBURGER TOGGLE ──
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.nav-hamburger');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');

        const spans = hamburger.querySelectorAll('span');
        if (navLinks.classList.contains('open')) {
          spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
          spans[1].style.opacity = '0';
          spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        }
      });

      // Close when a link is clicked (skip the Services dropdown toggle)
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (link.classList.contains('nav-dropdown-toggle')) return
          navLinks.classList.remove('open');
          const spans = hamburger.querySelectorAll('span');
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        });
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        const nav = document.querySelector('nav');
        if (nav && !nav.contains(e.target)) {
          navLinks.classList.remove('open');
        }
      });
    }

    // ── SERVICES DROPDOWN ──
    const dropdownItem   = document.querySelector('.nav-has-dropdown')
    const dropdownToggle = document.querySelector('.nav-dropdown-toggle')

    if (dropdownToggle && dropdownItem) {
      // Mobile — toggle on click
      dropdownToggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault()
          dropdownItem.classList.toggle('open')
        }
      })

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdownItem.contains(e.target)) {
          dropdownItem.classList.remove('open')
        }
      })
    }

    // ── SITIO CHIPS ──
    document.querySelectorAll('.sitio-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.sitio-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });

    // ── FILTER TABS ──
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const inner = tab.closest('.news-filter-inner');
        if (inner) inner.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

  }

});