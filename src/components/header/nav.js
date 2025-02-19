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
    this.#activateItem('today');

    this.#addEventListeners();
  }

  #populateNav() {
    const ul = createNode('ul');

    NAV_ITEMS.forEach(({name, icon}) => {
      const li = createNode('li');

      const link = createNode('a', {
        href: '#',
        'data-page': name,
      });
      
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

  #activateItem(pageName) {
    this.#node.querySelector('.nav-item-active')
      ?.classList.remove('nav-item-active');
    
    const item = this.#node.querySelector(`a[data-page="${pageName}"]`);
    item.classList.add('nav-item-active');
  }

  #handleNavClick(e) {
    e.preventDefault();
    
    const item = e.target.closest('a');
    const activeItem = this.#node.querySelector('.nav-item-active');
    if (!item || item === activeItem) return;

    const pageName = item.getAttribute('data-page');
    this.#activateItem(pageName);

    bus.emit(EVENTS.PAGE.NAVIGATE, pageName);
  }

  #addEventListeners() {
    this.#node.addEventListener('click', this.#handleNavClick.bind(this));

    window.addEventListener('popstate', (e) => {
      if (e.state?.page) {
        this.#activateItem(e.state.page);
      }
    });
  }

  get node() {
    return this.#node;
  }
}