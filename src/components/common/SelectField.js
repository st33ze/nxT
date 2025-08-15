import './SelectField.css';
import { createNode } from '../../utils/domUtils';

export default class SelectField {
  #field;
  #selectedBtn;

  constructor(options) {
    this.#field = SelectField.createSelectField();
    this.populate(options);
    this.#field.addEventListener('click', this.#clickHandler.bind(this));
  }

  static createSelectField() {
    return createNode('div', {
      class: 'select-field',
      role: 'group',
    });
  }

  #selectBtn(button) {
    this.#selectedBtn?.setAttribute('aria-pressed', 'false');
    button?.setAttribute('aria-pressed', 'true');
    this.#selectedBtn = button;

    this.#emitChange();
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

    this.#selectBtn(button === this.#selectedBtn ? null : button);
  }
  
  /** @param {Array} options - Array of objects with `value` and optional `label` properties */
  populate(options) {
    if (!Array.isArray(options)) return;

    options.forEach(option => {
      const button = createNode('button', {
        type: 'button',
        class: 'select-field--option',
        'aria-pressed': 'false',
        'data-value': option.value,
      });
      button.textContent = option.label || option.value;
      this.#field.appendChild(button);
    });
  }

  set value(value) {
    const button = this.#field.querySelector(`.select-field--option[data-value="${value}"]`);
    if (button !== this.#selectedBtn) this.#selectBtn(button);
  }

  get value() {
    return this.#selectedBtn?.dataset.value || null;
  }

  get node() {
    return this.#field;
  }

}