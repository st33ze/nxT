import './contentEditable.css';

export default class ContentEditable {
  #node

  constructor(tag, placeholder, content=null) {
    this.#node = document.createElement(tag);
    this.#node.classList.add('contenteditable');
    this.#node.textContent = content;
    this.#node.setAttribute('placeholder', placeholder);
    this.#node.setAttribute('tabindex', '0');
    this.#node.addEventListener('click', () => this.#edit());
  }

  #edit() {
    const element = this.#node;
    element.setAttribute('contenteditable', 'true');
    element.focus();

    element.addEventListener('blur', () => {
      element.setAttribute('contenteditable', 'false');
      if (!element.textContent.trim()) element.innerHTML = '';
    }, {once: true});
  }

  get node() {
    return this.#node;
  }
}