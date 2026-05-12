const html = document.documentElement;

function applyTheme(mode) {
  html.setAttribute('data-theme', mode);
  document.getElementById('themeBtn').textContent = mode === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('triploom-theme', mode);
}

function applyPreset(preset) {
  html.setAttribute('data-preset', preset);
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.swatch === preset);
  });
  localStorage.setItem('triploom-preset', preset);
}

function toggleTheme() {
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

function setPreset(preset) {
  applyPreset(preset);
}

// Restore saved preferences
const savedTheme  = localStorage.getItem('triploom-theme')  || 'light';
const savedPreset = localStorage.getItem('triploom-preset') || 'ocean';
applyTheme(savedTheme);
applyPreset(savedPreset);
