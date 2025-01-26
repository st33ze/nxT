import './today.css';
import Modal from '../components/modals/modal.js';
import TaskModal from '../components/modals/taskModal.js';
import { createNode } from '../utils/domUtils.js';
import { createSVGElement } from '../assets/icons.js';
import bus, { EVENTS } from '../utils/bus.js';
import TasksList from '../components/common/tasksList.js';
import db from '../utils/dbManager.js';

export default class Today {
  #node
  #modal
  #modalContent
  #newTaskBtn

  constructor() {
    this.#node = createNode('div', {'class': 'page-today'});

    const header = this.#createHeader();
    this.#newTaskBtn = this.#createNewTaskBtn();

    this.#modalContent = new TaskModal();
    this.#modal = new Modal(this.#modalContent.node);

    this.#addEventListeners();

    this.#node.append(header, this.#newTaskBtn, this.#modal.node);

    this.#loadTasks().then((tasks) => {
      const taskList = new TasksList(tasks);
      this.#node.insertBefore(taskList.node, this.#newTaskBtn);
    }).catch((error) => {
      console.error('Error loading tasks:', error);
    });
  }
  
  #createHeader() {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'today';
    
    header.appendChild(title);
    return header;
  }

  async #loadTasks() {
    const date = new Date(2025, 0, 24); // FOR TESTING ONLY
    const dateString = date.toLocaleDateString('en-CA');
    const tasks = await db.getTasksWithDate(dateString)

    return tasks;
  }

  #createNewTaskBtn() {
    const button = createNode('button', {
      'class': 'add-btn',
      'aria-label': 'Add a task',
    });
    button.appendChild(createSVGElement('add'));

    button.addEventListener('click', () => {
      // come up with taskModal.render(task) and adjust the taskModal correctly
      this.#modalContent.render();
      this.#modal.open(this.#modalContent.node);
      this.#newTaskBtn.disabled = true;
    });

    return button;
  }
  
  #activateNewTaskBtn() {
    this.#newTaskBtn.removeAttribute('disabled');
    this.#newTaskBtn.focus();
  }

  #addEventListeners() {
    bus.clear(EVENTS.MODAL_CLOSE, EVENTS.MODAL_SAVE);
    bus.on(EVENTS.MODAL.CLOSE, () => this.#activateNewTaskBtn());
    bus.on(EVENTS.TASK.SAVE, () => {
      if (this.#modal.isOpen) {
        this.#modal.close();
        this.#activateNewTaskBtn();
      }
    });
  }

  get node() {
    return this.#node;
  }
}