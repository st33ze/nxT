import './ContentEditable.css';
import { createNode } from '../../../utils/domUtils.js';

export default class ContentEditable {
  #node;

  constructor(tag, attributes) {
    this.#node = createNode(tag, {
      'class': 'contenteditable',
      'contenteditable': 'true',
      'spellcheck': 'false',
      ...attributes,
    });

    this.#node.addEventListener('blur', () => this.#handleBlur());
  }
  
  #handleBlur() {
    if (!this.#node.textContent.trim()) {
      this.#node.innerHTML = '';
    }
  }

  addEventListener(event, callback) {
    this.#node.addEventListener(event, callback);
  }

  set value(newValue) {
    this.#node.textContent = newValue ?? '';
  }

  get value() {
    return this.#node.textContent;
  }

  get node() {
    return this.#node;
  }

}