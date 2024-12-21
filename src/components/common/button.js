import './button.css';

export default class Button {
  #node

  constructor(event) {
    this.#node = document.createElement('button');
    this.#node.classList.add('add-btn');
    this.event = event;  
  }

  #createIcon() {
    const container = document.createElement('div');
    container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1"/></svg>`;

    const icon = container.querySelector('svg');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');

    return icon;
  }
  render() {
    this.#node.appendChild(this.#createIcon());

    return this.#node;
  }
}