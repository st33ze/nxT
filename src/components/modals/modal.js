import './modal.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, { EVENTS } from '../../utils/bus.js';

export default class Modal {
  #node
  #closeBtn
  #contentContainer

  constructor(onCloseCallback) {
    this.#node = createNode('div', {
      'class': 'modal',
      'aria-hidden': 'true',
    });
    this.onCloseCallback = onCloseCallback;
    
    this.#render();
  }
  
  #addEventListeners() {
    bus.on(EVENTS.MODAL.OPEN, (content) => this.#open(content));
    bus.on(EVENTS.MODAL.CLOSE, () => this.#close());
  }

  #render() {
    const modalWindow = createNode('div', {'class': 'modal-window'});

    this.#closeBtn = createNode('button', {'aria-label': 'Close'});
    this.#closeBtn.appendChild(createSVGElement('close'));
    this.#closeBtn.addEventListener('click', () => this.#close());

    this.#contentContainer = createNode('div', {'class': 'modal-content'});

    this.#addEventListeners();

    modalWindow.append(this.#closeBtn, this.#contentContainer);

    this.#node.appendChild(modalWindow);
  }

  #open(contentNode) {
    this.#contentContainer.appendChild(contentNode);
    this.#node.classList.add('modal-open');
    this.#node.setAttribute('aria-hidden', 'false');
    this.#closeBtn.focus();
  }
  
  #close() {
    this.#node.classList.add('modal-closing');
    this.#node.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      this.#node.classList.remove('modal-open', 'modal-closing');
      this.#contentContainer.innerHTML = '';
      this.onCloseCallback();
    }, 500);
  }
  
  get node() {
    return this.#node;
  }
}