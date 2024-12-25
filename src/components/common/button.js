import './button.css';

export default class Button {
  #node

  /**
   * Constructor for the Button class.
   * 
   * @param {string} label - The accessible label for the button.
   * @param {string|null} iconString - An optional SVG string representing the button's icon.
   */
  constructor(label, iconString=null) {
    this.#node = document.createElement('button');
    this.#node.classList.add(`${label}-btn`);

    // Append either the icon with an aria-label or a text node
    if (iconString) {
      this.#node.appendChild(this.#createIcon(iconString));
      this.#node.setAttribute('aria-label', label);
    } else this.#node.appendChild(document.createTextNode(label));
    
  }
  
  #createIcon(iconString) {
    const container = document.createElement('div');
    container.innerHTML = iconString;
    
    const icon = container.querySelector('svg');
    if (!icon) 
        throw new Error('Invalid SVG string: no <svg> element found.');
    
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    
    return icon;
  }

  /**
   * Getter for the button DOM node.
   * 
   * @returns {HTMLButtonElement} - The DOM node for the button.
   */
  get node() {
    return this.#node;
  }
}