import './modal.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, { EVENTS } from '../../utils/bus.js';

export default class Modal {
  #node

  constructor() {
    this.#node = createNode('div', {
      'class': 'modal',
      'aria-hidden': 'true',
    });
    
    this.#node.append(
      this.#createCloseBtn(),
      createNode('div', {class: 'modal-content'})
    );

    this.#addEventListeners();
  }
  
  #createCloseBtn() {
    const btn = createNode('button', {
      class: 'close-btn',
      'aria-label': 'Close',
    });
    btn.appendChild(createSVGElement('close'));

    btn.addEventListener('click', () => bus.emit(EVENTS.MODAL.CLOSE));

    return btn;
  }

  #open(contentNode) {
    this.#node.querySelector('.modal-content')
      .appendChild(contentNode);

    this.#node.classList.add('open');
    this.#node.setAttribute('aria-hidden', 'false');
    
    this.#node.querySelector('.close-btn').focus();
  }
  
  #close() {
    this.#node.classList.add('closing');
    this.#node.setAttribute('aria-hidden', 'true');
    
    setTimeout(() => {
      this.#node.classList.remove('open', 'closing');
      this.#node.querySelector('.modal-content').innerHTML = '';
    }, 500);
  }

  #addEventListeners() {
    bus.on(EVENTS.MODAL.OPEN, (content) => this.#open(content), {clearOnReload: true});
    bus.on(EVENTS.MODAL.CLOSE, () => this.#close(), {clearOnReload: true});
  }
  
  get node() {
    return this.#node;
  }
}