// ─── Security Utilities ───────────────────────────────────────────────────────

/** Escape HTML entities — use for ALL user text rendered into innerHTML */
export function esc(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
}

/** Only allow http/https/mailto URLs */
export function safeUrl(url) {
  if (!url) return '#'
  const u = String(url).trim()
  return /^https?:\/\//i.test(u) || /^mailto:/i.test(u) ? u : '#'
}

/** Clamp numeric input */
export function safeNum(val, min, max, fallback) {
  const n = parseFloat(val)
  return isNaN(n) ? fallback : Math.min(max, Math.max(min, n))
}

/** Allowed tags in editor block HTML */
const ALLOWED = /^(b|i|u|s|strong|em|span|br|a|mark)$/i

/** Strip dangerous HTML — keep safe formatting tags only */
export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = dirty

  const walk = (node) => {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i]
      if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase()
        if (!ALLOWED.test(tag)) {
          node.replaceChild(document.createTextNode(child.textContent || ''), child)
        } else {
          Array.from(child.attributes).forEach(a => {
            const name = a.name.toLowerCase()
            if (name.startsWith('on') || name === 'srcdoc') child.removeAttribute(a.name)
            if (name === 'href' || name === 'src') child.setAttribute(a.name, safeUrl(a.value))
          })
          walk(child)
        }
      }
    }
  }
  walk(tmp)
  return tmp.innerHTML
}

/** Client-side rate limiter for auth attempts */
const _authAttempts = { count: 0, reset: 0 }
export function checkAuthRateLimit() {
  const now = Date.now()
  if (now > _authAttempts.reset) { _authAttempts.count = 0; _authAttempts.reset = now + 60000 }
  if (++_authAttempts.count > 10) throw new Error('Muitas tentativas. Aguarde um minuto.')
}
