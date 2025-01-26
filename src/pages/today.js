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

  #activateNewTaskBtn() {
    this.#newTaskBtn.removeAttribute('disabled');
    this.#newTaskBtn.focus();
  }
  
  #getTodayStringDate() {
    const date = new Date();
    return date.toLocaleDateString('en-CA');
  }

  #openModal(task={}) {
    task.date = task.date ?? this.#getTodayStringDate();
    this.#modalContent.render(task);
    this.#modal.open(this.#modalContent.node);
    this.#newTaskBtn.disabled = true;
    
    bus.on(EVENTS.MODAL.CLOSE, () => this.#activateNewTaskBtn(), {once: true});
  }
  
  #createNewTaskBtn() {
    const button = createNode('button', {
      'class': 'add-btn',
      'aria-label': 'Add a task',
    });
    button.appendChild(createSVGElement('add'));
    button.addEventListener('click', () => this.#openModal());
    
    return button;
  }
  
  #addEventListeners() {
    bus.clear(EVENTS.MODAL_SAVE);
    bus.on(EVENTS.MODAL.OPEN, (id) => {
      db.getEntity('tasks', parseInt(id, 10)).then((task) => this.#openModal(task));
    });
    bus.on(EVENTS.TASK.SAVE, () => {
      if (this.#modal.isOpen) {
        this.#modal.close();
        this.#activateNewTaskBtn();
      }
    });
  }
  
  async #loadTasks() {
    // const dateString = this.#getTodayStringDate();
    const date = new Date(2025, 0, 24); // FOR TESTING ONLY
    const dateString = date.toLocaleDateString('en-CA');
    const tasks = await db.getTasksByDate(dateString);

    return tasks;
  }

  get node() {
    return this.#node;
  }
}