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
  #modalContent
  #modal
  #taskList

  constructor() {
    this.#node = createNode('div', {'class': 'page-today'});

    const pageContent = createNode('div', {class: 'today-content'});
    const header = this.#createHeader();
    const newTaskBtn = this.#createNewTaskBtn();
    pageContent.append(header, newTaskBtn);

    this.#modalContent = new TaskModal();
    this.#modal = new Modal(() => this.#onModalClose());

    this.#addEventListeners();

    this.#node.append(pageContent, this.#modal.node);

    this.#loadTasksFromDB().then((tasks) => {
      this.#taskList = new TasksList(tasks);
      pageContent.appendChild(this.#taskList.node);
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
  
  #getTodayStringDate() {
    const date = new Date();
    return date.toLocaleDateString('en-CA');
  }
  
  #openModal(task={}) {
    task.date = task.date ?? this.#getTodayStringDate();
    this.#modalContent.render(task);
    bus.emit(EVENTS.MODAL.OPEN, this.#modalContent.node);
    this.#node.querySelector('.today-content').setAttribute('inert', '');
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
  
  #onModalClose() {
    this.#node.querySelector('.today-content').removeAttribute('inert');
    this.#node.querySelector('.add-btn').focus();
  }

  #addEventListeners() {
    // add {clearAfterReload: true}  ??
    bus.on(EVENTS.TASKS_LIST.TASK_DETAILS, (id) => {
      db.getEntity('tasks', id).then((task) => this.#openModal(task));
    });

    bus.on(EVENTS.TASK.SAVE, (task) => {
      if (task.id) this.#taskList.update(task);
    });

    bus.on(EVENTS.DATABASE.TASK_ADDED, (task) => {
      const date = new Date(2025, 0, 24); // FOR TESTING ONLY
      const dateString = date.toLocaleDateString('en-CA');
      if (task.date === dateString) this.#taskList.add(task);
    });
  }

  async #loadTasksFromDB() {
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