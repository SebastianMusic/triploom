const html = document.documentElement;

const presetToSuffix = { ocean: 'lagoon', citrus: 'sunset', forest: 'palm', rose: 'coral' };

function updateScreenshots() {
  const theme = html.getAttribute('data-theme');
  const preset = html.getAttribute('data-preset');
  const suffix = presetToSuffix[preset] || 'lagoon';
  document.querySelectorAll('.phone-screenshot').forEach(img => {
    const screen = img.dataset.screen;
    img.onerror = function() {
      this.onerror = null;
      this.src = `images/${screen}_${theme}_${suffix}.jpg`;
    };
    img.src = `images/${screen}_${theme}_${suffix}.png`;
  });
}

function applyTheme(mode) {
  html.setAttribute('data-theme', mode);
  document.getElementById('themeBtn').textContent = mode === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('triploom-theme', mode);
  updateScreenshots();
}

function applyPreset(preset) {
  html.setAttribute('data-preset', preset);
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.swatch === preset);
  });
  localStorage.setItem('triploom-preset', preset);
  updateScreenshots();
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
