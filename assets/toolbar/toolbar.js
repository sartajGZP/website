document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  // 1. FONT SIZE (Limit increased to 2.4rem)
  const sizeResetBtn = document.getElementById('size-reset');
  const setSize = (newSize) => {
    // Increased max limit from 1.6 to 2.4
    const size = Math.min(Math.max(newSize, 0.8), 2.4);
    root.style.setProperty('--font-size', `${size.toFixed(1)}rem`);
    localStorage.setItem('user-font-size', size.toFixed(1));
    if (sizeResetBtn) sizeResetBtn.textContent = `${Math.round(size * 100)}%`;
  };

  const initialSize = parseFloat(localStorage.getItem('user-font-size')) || 1.0;
  setSize(initialSize);

  document.getElementById('size-up')?.addEventListener('click', () => {
    const curr = parseFloat(localStorage.getItem('user-font-size')) || 1.0;
    setSize(curr + 0.1);
  });

  document.getElementById('size-down')?.addEventListener('click', () => {
    const curr = parseFloat(localStorage.getItem('user-font-size')) || 1.0;
    setSize(curr - 0.1);
  });

  sizeResetBtn?.addEventListener('click', () => setSize(1.0));


    // 2. BOLDNESS / FONT WEIGHT (Using predefined visual milestones & text indicator)
  const weights = [300, 400, 700, 900]; // Light, Normal, Bold, Black
  
  // Mapping numbers to friendly names for the UI
  const weightNames = {
    300: "Light",
    400: "Normal",
    700: "Bold",
    900: "Black"
  };

  const weightResetBtn = document.getElementById('weight-reset');

  const setWeight = (newWeight) => {
    // Ensure the value being saved is actually one of our defined weights
    const weight = weights.includes(newWeight) ? newWeight : 400;
    root.style.setProperty('--font-weight', weight);
    localStorage.setItem('user-font-weight', weight);
    
    // Update the middle button text to show the current weight
    if (weightResetBtn) {
      weightResetBtn.textContent = weightNames[weight];
    }
  };

  const initialWeight = parseInt(localStorage.getItem('user-font-weight')) || 400;
  setWeight(initialWeight);

  document.getElementById('weight-up')?.addEventListener('click', () => {
    const curr = parseInt(localStorage.getItem('user-font-weight')) || 400;
    let index = weights.indexOf(curr);
    if (index === -1) index = 1; 

    // Move up one step
    if (index < weights.length - 1) {
      setWeight(weights[index + 1]);
    }
  });

  document.getElementById('weight-down')?.addEventListener('click', () => {
    const curr = parseInt(localStorage.getItem('user-font-weight')) || 400;
    let index = weights.indexOf(curr);
    if (index === -1) index = 1;

    // Move down one step
    if (index > 0) {
      setWeight(weights[index - 1]);
    }
  });

  // Clicking the text itself resets back to normal (400)
  weightResetBtn?.addEventListener('click', () => setWeight(400));


  // 3. FONT FAMILY (Native Select element, language-aware)
  // Self-hosted webfonts are lazy: the stylesheet is injected only when a
  // selected stack actually references the font.
  const ensureWebfont = (value) => {
    if (!value || value.indexOf('Kalam') === -1) return;
    if (document.querySelector('link[data-font="kalam"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/fonts/kalam.css';
    link.setAttribute('data-font', 'kalam');
    document.head.appendChild(link);
  };

  const fontSelect = document.getElementById('font-family');
  if (fontSelect) {
    // Font preference is stored per language so a Latin stack never leaks
    // onto Devanagari content (and vice versa) when switching languages.
    const pageLang = fontSelect.dataset.lang || document.documentElement.lang || 'en';
    const storageKey = `user-font-family-${pageLang}`;

    // One-time migration from the legacy global key: only adopt it if it is a
    // valid option for the current language, then remove the legacy key.
    let savedFont = localStorage.getItem(storageKey);
    if (!savedFont) {
      const legacyFont = localStorage.getItem('user-font-family');
      if (legacyFont && [...fontSelect.options].some((opt) => opt.value === legacyFont)) {
        savedFont = legacyFont;
        localStorage.setItem(storageKey, legacyFont);
        localStorage.removeItem('user-font-family');
      }
    }

    // Priority: Saved value for this language -> Current Dropdown Value -> First Option
    const activeFont = savedFont || fontSelect.value;

    // Apply font to CSS variable & ensure dropdown matches
    root.style.setProperty('--font-family', activeFont);
    ensureWebfont(activeFont);
    if ([...fontSelect.options].some((opt) => opt.value === activeFont)) {
      fontSelect.value = activeFont;
    }

    fontSelect.addEventListener('change', (e) => {
      root.style.setProperty('--font-family', e.target.value);
      ensureWebfont(e.target.value);
      localStorage.setItem(storageKey, e.target.value);
    });
  }


  // 4. LINE SPACING
  const spacingBtns = document.querySelectorAll('.spacing-btn');
  const setLineHeight = (lh) => {
    root.style.setProperty('--line-height', lh);
    localStorage.setItem('user-line-height', lh);
    spacingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.lh === String(lh)));
  };

  const initialLh = localStorage.getItem('user-line-height') || '1.6';
  setLineHeight(initialLh);

  spacingBtns.forEach(btn => {
    btn.addEventListener('click', () => btn.dataset.lh && setLineHeight(btn.dataset.lh));
  });
});

