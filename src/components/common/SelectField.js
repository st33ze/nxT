import './SelectField.css';
import { createNode } from '../../utils/domUtils';

export default class SelectField {
  #field;

  constructor(options) {
    this.#field = this.#createSelectField(options);
  }

  #createSelectField(options) {
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

  get node() {
    return this.#field;
  }

}