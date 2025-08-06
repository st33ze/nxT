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
    this.#selectedBtn?.setAttribute('aria-pressed', 'false');
    this.#selectedBtn = this.#selectedBtn === button ? null : button;

    this.#selectedBtn?.setAttribute('aria-pressed', 'true');
  }

  #emitChange() {
    const event = new CustomEvent('change', {
      detail: { value: this.value },
    });
    this.#field.dispatchEvent(event);
  }

  #clickHandler(event) {
    const button = event.target.closest('.select-field--option');
    if (!button) return;

    this.#selectBtn(button);
    this.#emitChange();
  }
  
  set value(value) {
    const button = this.#field.querySelector(`.select-field--option[data-value="${value}"]`);
    this.#selectBtn(button);
  }

  get value() {
    return this.#selectedBtn?.dataset.value || null;
  }

  get node() {
    return this.#field;
  }

}