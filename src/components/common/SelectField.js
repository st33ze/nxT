import './SelectField.css';
import { createNode } from '../../utils/domUtils';

export default class SelectField {
  #field;
  #selectedBtn;

  constructor(options) {
    this.#field = SelectField.createSelectField(options);
    this.#field.addEventListener('click', this.#clickHandler.bind(this));
  }

  static createSelectField(options) {
    const field = createNode('div', {
      class: 'select-field',
      role: 'group',
    });

    options.forEach(option => {
      const button = createNode('button', {
        type: 'button',
        class: 'select-field--option',
        'aria-pressed': 'false',
        'data-value': option,
      });
      button.textContent = option;
      field.appendChild(button);
    });

    return field;
  }

  #selectBtn(button) {
    if (!button) return;
    this.#selectedBtn?.setAttribute('aria-pressed', 'false');
    if (this.#selectedBtn === button) {
      this.#selectedBtn = null;
    } else {
      this.#selectedBtn = button;
      button.setAttribute('aria-pressed', 'true');
    }
  }

  #clickHandler(event) {
    const button = event.target.closest('.select-field--option');
    this.#selectBtn(button);
  }

  get node() {
    return this.#field;
  }

}