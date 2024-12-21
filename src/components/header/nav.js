import './nav.css';
import {icons} from '../../assets/icons.js';

export default class Navbar {
  #node;
  #activeItem = null;

  constructor() {
    this.#node = document.createElement('nav');
    this.#node.classList.add('main-nav');
  }

  /**
   * Generates a list of menu items for the navbar.
   * Each item includes a name and an icon.
   * @returns {Array<{name: string, icon: string}>} - List of menu items.
   */
  #generateItems() {
    return [
      {name: 'today', icon: icons.today},
      {name: 'inbox', icon: icons.inbox},
      {name: 'projects', icon: icons.projects}
    ];
  } 

  /**
   * Creates and populates the navbar with navigation items.
   * Each item consists of a link, an icon, and a name.
   * @returns {HTMLUListElement} - The <ul> element containing all the list items.
   */
  #populate() {
    const ul = document.createElement('ul');
    const menuItems = this.#generateItems();

    menuItems.forEach(({name, icon}) => {
      const li = document.createElement('li');

      const link = document.createElement('a');
      link.href = `#${name}`;
      
      const iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.innerHTML = icon;

      const textSpan = document.createElement('span');
      textSpan.textContent = name;

      link.append(iconSpan, textSpan);
      li.appendChild(link);
      ul.appendChild(li);
    });

    return ul;
  }

  /**
   * Activates a navigation item based on its href attribute.
   * Highlights the active item and removes the highlight from the previously active item.
   * @param {string} href - The href value of the item to activate (e.g., '#today').
   */
  #activateItem(href) {
    const item = this.#node.querySelector(`a[href="${href}"]`);
    if (!item) return;

    if (this.#activeItem)
      this.#activeItem.classList.remove('nav-item-active');

    item.classList.add('nav-item-active');
    this.#activeItem = item;
  }

  /**
   * Populates the navbar and sets the default active item.
   * @returns {HTMLElement} - The <nav> element containing the navbar.
   */
  render() {
    const ul = this.#populate();
    this.#node.appendChild(ul);

    this.#activateItem('#today');

    return this.#node;
  }
}