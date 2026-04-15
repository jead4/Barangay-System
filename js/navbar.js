/* ============================================================
   NAVBAR.JS — Loads navbar component and handles mobile menu
   Place in: js/navbar.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── LOAD navbar.html into #navbar-container ──
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
    // If navbar is already hardcoded in the page
    initNavbar();
  }

  function initNavbar() {

    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.nav-hamburger');

    // ── HAMBURGER TOGGLE ──
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navLinks.classList.toggle('open');

        // Animate to X
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

      // Close when a link is clicked
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
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

    // ── ACTIVE LINK ──
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (currentPath === linkPath || 
          (currentPath === '/' && linkPath === '/index.html')) {
        link.classList.add('active');
      }
    });

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