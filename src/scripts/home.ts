// Home page entry: scroll effects, reveal, widgets, menu wheel, project modal, contact form.
import { start, remeasure } from './scroll-fx';
import { reveal } from './reveal';
import { initProjects } from './projects';
import './widgets';
import './menu';
import './contact';
import { TITLES } from './titles';
import { persona } from './state';

// Old single-page blog links: /#blog and /#blog/<slug>.
const legacy = location.hash.match(/^#blog(?:\/([a-z0-9-]+))?$/);
if (legacy) location.replace(legacy[1] ? `/blog/${legacy[1]}/` : '/blog/');

start();
reveal();
initProjects();
document.addEventListener('persona:change', () => {
  reveal();
  remeasure();
  if (!document.querySelector('[data-modal]:not([hidden])')) document.title = TITLES[persona()];
});
document.title = TITLES[persona()];
