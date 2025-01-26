import './modal.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, { EVENTS } from '../../utils/bus.js';

/**
 * Class representing a modal dialog.
 */
export default class Modal {
  /** @type {HTMLElement} */ #node
  /** @type {HTMLElement} */ #closeBtn
  /** @type {HTMLElement} */ #contentContainer

  constructor() {
    this.#node = createNode('div', {
      'class': 'modal',
      'aria-hidden': 'true',
    });
    this.#render()
  }
  
  #render() {
    const modalWindow = createNode('div', {'class': 'modal-window'});

    this.#closeBtn = createNode('button', {'aria-label': 'Close'});
    this.#closeBtn.appendChild(createSVGElement('close'));
    this.#closeBtn.addEventListener('click', () => {
      bus.emit(EVENTS.MODAL.CLOSE);
      this.close();
    });

    this.#contentContainer = createNode('div', {'class': 'modal-content'});

    modalWindow.append(this.#closeBtn, this.#contentContainer);

    this.#node.appendChild(modalWindow);
  }

  open(contentNode) {
    this.#contentContainer.appendChild(contentNode);
    this.#node.classList.add('modal-open');
    this.#node.setAttribute('aria-hidden', 'false');
    this.#closeBtn.focus();
  }
  
  close() {
    this.#node.classList.add('modal-closing');
    this.#node.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      this.#node.classList.remove('modal-open', 'modal-closing');
      this.#contentContainer.innerHTML = '';
    }, 500);
  }
  
  get isOpen() {
    return this.#node.classList.contains('modal-open');
  }

  get node() {
    return this.#node;
  }
}