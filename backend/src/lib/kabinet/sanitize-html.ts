// Description HTML from the product form goes straight into the storefront page, so only
// simple formatting survives: paragraphs, line breaks, bold/italic, lists, headings and
// links to http(s) or site paths. Everything else (scripts, styles, event handlers,
// iframes, unknown tags) is removed; text inside removed formatting tags is kept.

const ALLOWED = new Set(["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "h2", "h3", "h4", "a", "span", "table", "thead", "tbody", "tr", "th", "td"])
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi

const escapeAttr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/^["']|["']$/g, "")
  if (/^https?:\/\//i.test(href) || (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("#")) return href
  return null
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DROP_WITH_CONTENT, "")
    .replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g, (_tag, closing: string, name: string, attrs: string) => {
      const tag = name.toLowerCase()
      if (!ALLOWED.has(tag)) return ""
      if (closing) return `</${tag}>`
      if (tag === "a") {
        const match = attrs.match(/\bhref\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i)
        const href = match ? safeHref(match[1]) : null
        const external = href ? /^https?:\/\//i.test(href) : false
        return href ? `<a href="${escapeAttr(href)}"${external ? ' rel="noopener nofollow" target="_blank"' : ""}>` : "<a>"
      }
      if (tag === "td" || tag === "th") {
        const span = attrs.match(/\b(colspan|rowspan)\s*=\s*["']?(\d{1,2})/i)
        return span ? `<${tag} ${span[1].toLowerCase()}="${span[2]}">` : `<${tag}>`
      }
      return `<${tag}>`
    })
    .replace(/<(?![a-z/])/gi, "&lt;")
}
