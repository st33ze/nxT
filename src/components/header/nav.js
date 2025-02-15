import './nav.css';
import { createNode } from '../../utils/domUtils';
import { createSVGElement } from '../../assets/icons';
import bus, { EVENTS } from '../../utils/bus';

const NAV_ITEMS = [
  {name: 'today', icon: createSVGElement('today')},
  {name: 'inbox', icon: createSVGElement('inbox')},
  {name: 'projects', icon: createSVGElement('projects')}
];

export default class Navbar {
  #node;

  constructor() {
    this.#node = createNode('nav', {class: 'main-nav'});
    
    this.#populateNav();
    this.#activateItem(this.#node.querySelector('a[href="#today"]'));

    this.#node.addEventListener('click', this.handleNavClick.bind(this));
  }

  #populateNav() {
    const ul = createNode('ul');

    NAV_ITEMS.forEach(({name, icon}) => {
      const li = createNode('li');

      const link = createNode('a');
      link.href = `#${name}`;
      
      const iconSpan = createNode('span', {'aria-hidden': 'true'});
      iconSpan.appendChild(icon);

      const textSpan = createNode('span');
      textSpan.textContent = name;

      link.append(iconSpan, textSpan);
      li.appendChild(link);
      ul.appendChild(li);
    });

    this.#node.appendChild(ul);
  }

  #activateItem(item) {
    this.#node.querySelector('.nav-item-active')?.classList.remove('nav-item-active');
    
    item.classList.add('nav-item-active');
  }

  handleNavClick(e) {
    const item = e.target.closest('a');
    if (!item) return;

    this.#activateItem(item);
    
    const pageName = item.getAttribute('href').replace('#', '');
    bus.emit(EVENTS.PAGE.NAVIGATE, pageName);
  }

  get node() {
    return this.#node;
  }
}