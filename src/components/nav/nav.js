import './nav.css';

class Navbar {
  #node;
  #navItems = [];
  #activeItem = null;

  constructor(items) {
    this.#navItems = items;
  }

  /**
   * Populates the navbar with a list of navigation items.
   * Each item consists of a link, an icon, and a name.
   * @returns {HTMLElement} - The <ul> element containing all the list items.
   */
  #populate() {
    const ul = document.createElement('ul');

    this.#navItems.forEach(item => {
      const li = document.createElement('li');

      const link = document.createElement('a');
      link.href = `#${item.name}`;
      
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', true);
      icon.innerHTML = item.icon;

      const text = document.createElement('span');
      text.textContent = item.name;

      link.appendChild(icon);
      link.appendChild(text);

      li.appendChild(link);
      ul.appendChild(li);
    });

    return ul;
  }

  /**
   * Activates the navigation item based on the provided href.
   * Adds the 'nav-item-active' class to the clicked item and removes it from the previous active item.
   * @param {string} href - The href value of the item to activate.
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
   * Initializes the Navbar.
   * @returns {HTMLElement} - The <nav> element containing the populated navbar.
   */
  init() {
    const ul = this.#populate();
    
    this.#node = document.createElement('nav');
    this.#node.classList.add('main-nav');
    this.#node.appendChild(ul);

    this.#activateItem('#today');

    return this.#node;
  }
}

export default Navbar;