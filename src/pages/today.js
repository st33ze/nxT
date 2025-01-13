import './today.css';
import Modal from '../components/modals/modal.js';
import TaskModal from '../components/modals/taskModal.js';
import { createNode } from '../utils/domUtils.js';
import { createSVGElement } from '../assets/icons.js';
import bus, { EVENTS } from '../utils/bus.js';

export default class Today {
  #node
  #modal
  #newTaskBtn

  constructor() {
    this.#node = createNode('div', {'class': 'page-today'});

    const header = this.#createHeader();
    this.#newTaskBtn = this.#createNewTaskBtn();

    const modalContent = new TaskModal();
    this.#modal = new Modal(modalContent.node);

    this.#addEventListeners();

    this.#node.append(header, this.#newTaskBtn, this.#modal.node);
  }
  
  #createHeader() {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'today';

    header.appendChild(title);
    return header;
  }

  #createNewTaskBtn() {
    const button = createNode('button', {
      'class': 'add-btn',
      'aria-label': 'Add a task',
    });
    button.appendChild(createSVGElement('add'));

    button.addEventListener('click', () => {
      this.#modal.open();
      this.#newTaskBtn.setAttribute('disabled', 'true');
    });

    return button;
  }
  
  #activateNewTaskBtn() {
    this.#newTaskBtn.removeAttribute('disabled');
    this.#newTaskBtn.focus();
  }

  #addEventListeners() {
    bus.clear(EVENTS.MODAL_CLOSE, EVENTS.MODAL_SAVE);
    bus.on(EVENTS.MODAL_CLOSE, () => this.#activateNewTaskBtn());
    bus.on(EVENTS.MODAL_SAVE, (task) => {
      console.log(task);
      this.#modal.close();
      this.#activateNewTaskBtn();
    })

  }
  /**
   * Getter for the root DOM node of the "Today" page.
   * @returns {HTMLElement} The root DOM node.
   */
  get node() {
    return this.#node;
  }
}