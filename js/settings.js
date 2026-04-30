/* ============================================ */
/*          DANMAKU CHAT - SETTINGS LOGIC       */
/* ============================================ */

// ---- Section Toggle ----
function toggleSection(header) {
    const section = header.parentElement;
    section.classList.toggle('collapsed');
}

// ---- Platform toggle show/hide settings ----
document.querySelectorAll('input[data-toggle]').forEach(input => {
    const targetId = input.getAttribute('data-toggle');
    const target = document.getElementById(targetId);
    if (target) {
        const updateVisibility = () => {
            target.style.display = input.checked ? 'block' : 'none';
        };
        input.addEventListener('change', updateVisibility);
        updateVisibility();
    }
});

// ---- Range Value Display ----
document.querySelectorAll('input[type="range"]').forEach(range => {
    const valueDisplay = range.parentElement.querySelector('.range-value');
    if (valueDisplay) {
        const updateValue = () => {
            let val = range.value;
            if (range.name === 'frontChance' || range.name === 'backChance') {
                val = Math.round(parseFloat(val) * 100) + '%';
            } else if (range.name === 'danmakuSpeed') {
                val = val + 's';
            } else if (range.name === 'danmakuDensity') {
                val = val + 'px';
            } else if (range.name === 'backLayerBlur') {
                val = val + 'px';
            }
            valueDisplay.textContent = val;
        };
        range.addEventListener('input', updateValue);
        updateValue();
    }
});

// ---- Generate Layer URLs ----
function generateURL(layer) {
    const form = document.getElementById('settings-form');
    const formData = new FormData(form);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
        if (key === 'layer') continue; // We override this
        if (value === '' || value === undefined) continue;

        // Handle checkboxes
        const input = form.querySelector(`[name="${key}"]`);
        if (input && input.type === 'checkbox') {
            if (input.checked) {
                params.set(key, 'true');
            } else {
                params.set(key, 'false');
            }
        } else {
            params.set(key, value);
        }
    }

    // Set the layer
    params.set('layer', layer);

    const basePath = window.location.pathname.replace('settings.html', 'index.html');
    return `${basePath}?${params.toString()}`;
}

function updateLayerURLs() {
    ['front', 'middle', 'back'].forEach(layer => {
        const urlEl = document.getElementById(`url-${layer}`);
        if (urlEl) {
            urlEl.textContent = generateURL(layer);
        }
    });
}

// ---- Copy URL on click ----
document.querySelectorAll('.url-box code').forEach(code => {
    code.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(code.textContent);
            const original = code.style.background;
            code.style.background = 'rgba(0, 200, 100, 0.2)';
            setTimeout(() => {
                code.style.background = original;
            }, 500);
        } catch (e) {
            // Fallback: select text
            const range = document.createRange();
            range.selectNodeContents(code);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    });
});

// ---- Load settings from URL params on page load ----
function loadSettingsFromURL() {
    const params = new URLSearchParams(window.location.search);
    const form = document.getElementById('settings-form');

    for (const [key, value] of params.entries()) {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) continue;

        if (input.type === 'checkbox') {
            input.checked = value === 'true';
        } else if (input.type === 'range') {
            input.value = value;
            input.dispatchEvent(new Event('input'));
        } else if (input.type === 'select-one') {
            input.value = value;
        } else {
            input.value = value;
        }
    }
}

// ---- Initialize ----
loadSettingsFromURL();
updateLayerURLs();

// Update URLs whenever any setting changes
document.getElementById('settings-form').addEventListener('change', () => {
    updateLayerURLs();
});

document.getElementById('settings-form').addEventListener('input', () => {
    updateLayerURLs();
});
