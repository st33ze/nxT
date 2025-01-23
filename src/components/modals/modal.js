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

  /**
   * Creates a new Modal instance.
   * @param {HTMLElement} content - The content to display inside the modal.
   */
  constructor(content) {
    this.#node = createNode('div', {
      'class': 'modal',
      'aria-hidden': 'true',
    });
    this.#render(content)
  }
  
  /**
   * Creates a new Modal instance.
   * @param {HTMLElement} content - The content to display inside the modal.
   */
  #render(content) {
    const modalWindow = createNode('div', {'class': 'modal-window'});

    // Create and configure the close button
    this.#closeBtn = createNode('button', {'aria-label': 'Close'});
    this.#closeBtn.appendChild(createSVGElement('close'));
    this.#closeBtn.addEventListener('click', () => {
      bus.emit(EVENTS.MODAL.CLOSE);
      this.close();
    });

    // Create and append the content container
    const contentContainer = createNode('div', {'class': 'modal-content'});
    contentContainer.appendChild(content);

    modalWindow.append(this.#closeBtn, contentContainer);

    this.#node.appendChild(modalWindow);
  }

  /**
   * Opens the modal.
   */
  open() {
    this.#node.classList.add('modal-open');
    this.#node.setAttribute('aria-hidden', 'false');
    this.#closeBtn.focus();
  }
  
  /**
   * Closes the modal with a transition effect.
   */
  close() {
    this.#node.classList.add('modal-closing');
    this.#node.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
      this.#node.classList.remove('modal-open', 'modal-closing');
    }, 500);
  }
  
  get isOpen() {
    return this.#node.classList.contains('modal-open');
  }

  /**
   * Retrieves the root node of the modal.
   * @returns {HTMLElement} The root node of the modal.
   */
  get node() {
    return this.#node;
  }
}