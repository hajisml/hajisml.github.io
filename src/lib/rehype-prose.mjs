// Shapes rendered Markdown like the original design's renderer:
// - fenced code → <figure class="code"> with a language caption
// - a paragraph holding only an image → <figure class="img"> captioned with its alt text
// - external links open in a new tab
const isBlank = n => n.type === 'text' && !n.value.trim();
const text = v => ({ type: 'text', value: v });
const el = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });

function visit(node) {
  if (!node.children) return;
  node.children = node.children.map(child => {
    if (child.type !== 'element') return child;

    if (child.tagName === 'pre') {
      const code = child.children.find(c => c.type === 'element' && c.tagName === 'code');
      const cls = (code && code.properties.className) || [];
      const lang = cls.map(String).find(c => c.startsWith('language-'))?.slice(9);
      child.properties.tabIndex = 0;
      return el('figure', { className: ['code'] }, [...(lang ? [el('figcaption', {}, [text(lang)])] : []), child]);
    }

    if (child.tagName === 'p') {
      const kids = child.children.filter(c => !isBlank(c));
      if (kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'img') {
        const img = kids[0];
        img.properties.loading = 'lazy';
        const alt = img.properties.alt || '';
        return el('figure', { className: ['img'] }, [img, ...(alt ? [el('figcaption', {}, [text(alt)])] : [])]);
      }
    }

    if (child.tagName === 'img') child.properties.loading = 'lazy';

    if (child.tagName === 'a' && /^https?:/.test(String(child.properties.href || ''))) {
      child.properties.target = '_blank';
      child.properties.rel = ['noopener'];
    }

    visit(child);
    return child;
  });
}

export function rehypeProse() {
  return tree => visit(tree);
}
