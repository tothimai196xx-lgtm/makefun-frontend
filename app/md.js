// A small Markdown renderer for bounty descriptions (the API serves them as
// Markdown). It covers what bounty text actually uses: headings, bold,
// italic, inline code, links, lists, blockquotes and fenced code. Raw HTML in
// the source is escaped, never rendered, and links are forced to open in a
// new tab with rel="noopener" so a description can never hijack this page.

import { esc } from './format.js';

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const ITALIC_RE = /(^|[^*])\*([^*]+)\*/g;
const CODE_RE = /`([^`]+)`/g;

function inline(text) {
  let out = esc(text);
  out = out.replace(CODE_RE, (_m, code) => '<code>' + code + '</code>');
  out = out.replace(LINK_RE, (_m, label, href) => {
    const safe = href.replaceAll('"', '%22');
    return `<a href="${safe}" target="_blank" rel="noopener">${label}</a>`;
  });
  out = out.replace(BOLD_RE, '<strong>$1</strong>');
  out = out.replace(ITALIC_RE, '$1<em>$2</em>');
  return out;
}

/** Render Markdown to an HTML string. The caller inserts it with innerHTML. */
export function renderMarkdown(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;

  const flushPara = (buf) => {
    if (buf.length) html.push('<p>' + inline(buf.join(' ')) + '</p>');
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block.
    if (line.startsWith('```')) {
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i += 1; // skip the closing fence
      html.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
      continue;
    }

    // ATX heading.
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>` + inline(heading[2]) + `</h${level}>`);
      i += 1;
      continue;
    }

    // Horizontal rule.
    if (/^---+$/.test(line.trim())) {
      html.push('<hr>');
      i += 1;
      continue;
    }

    // Blockquote.
    if (line.startsWith('> ')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('> ')) buf.push(lines[i].slice(2));
      html.push('<blockquote><p>' + inline(buf.join(' ')) + '</p></blockquote>');
      i += 1;
      continue;
    }

    // List (unordered or ordered), one level.
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        items.push(inline(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, '')));
        i += 1;
      }
      html.push((ordered ? '<ol>' : '<ul>') + items.map((t) => '<li>' + t + '</li>').join('') + (ordered ? '</ol>' : '</ul>'));
      continue;
    }

    // Blank line ends a paragraph.
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Paragraph: gather until a blank line or a block starter.
    const buf = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !lines[i].startsWith('> ') &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i += 1;
    }
    flushPara(buf);
  }

  return html.join('\n');
}
