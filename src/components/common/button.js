import './button.css';

export default class Button {
  #node

  constructor(iconString=null, className='', event) {
    this.#node = document.createElement('button');
    this.#node.classList.add(className);
    this.iconString = iconString;
    this.event = event;  
  }

  #createIcon() {
    const container = document.createElement('div');
    container.innerHTML = this.iconString;

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