import './addButton.css'
import { createNode } from "../../utils/domUtils"
import { createSVGElement } from "../../assets/icons";

export default class AddButton {
  #node

  constructor() {
    this.#node = createNode('button', {class: 'add-btn'});
    this.#node.appendChild(createSVGElement('add'));
  }

  addEventListener(event, callback) {
    this.#node.addEventListener(event, callback);
  }

  /**
   * Sets aria-label for the button.
   * @param {string} label
   */
  set label(label) {
    this.#node.setAttribute('aria-label', label);
  }

  get node() {
    return this.#node;
  }
}