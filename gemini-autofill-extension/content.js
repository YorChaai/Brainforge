(function () {
  // Capture #bf_prompt immediately at document_start before Gemini router clears hash
  const initialHash = window.location.hash || '';
  const match = initialHash.match(/[#&]bf_prompt=([^&]+)/);
  if (!match) return;

  let promptText = null;
  try {
    promptText = decodeURIComponent(match[1]);
  } catch {
    return;
  }
  if (!promptText) return;

  function fillGeminiBox() {
    const selectors = [
      'rich-textarea div.ql-editor[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea',
    ];

    let editor = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        editor = el;
        break;
      }
    }

    if (!editor) return false;

    editor.focus();

    if (editor.tagName === 'TEXTAREA') {
      editor.value = promptText;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      editor.innerHTML = '';
      const lines = promptText.split('\n');
      lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line || '\u200B';
        editor.appendChild(p);
      });
      editor.classList.remove('ql-blank');
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, data: promptText }));
    }

    return true;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    if (fillGeminiBox() || attempts > 60) {
      clearInterval(timer);
    }
  }, 250);
})();
