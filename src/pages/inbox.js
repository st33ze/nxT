import './inbox.css';
import Modal from '../components/modals/modal.js';
import TaskModal from '../components/modals/taskModal.js';
import { createNode } from '../utils/domUtils.js';
import { createSVGElement } from '../assets/icons.js';
import bus, { EVENTS } from '../utils/bus.js';
import { MultiTaskLists } from '../components/common/taskList.js';
import db from '../utils/dbManager.js';

export default class Inbox {
  #node
  #modalContent
  #modal
  #tasksLists

  constructor() {
    this.#node = createNode('div', {'class': 'page-inbox'});

    const pageContent = createNode('div', {class: 'inbox-content'});
    const header = this.#createHeader();
    const newTaskBtn = this.#createNewTaskBtn();
    pageContent.append(header, newTaskBtn);

    this.#modalContent = new TaskModal();
    this.#modal = new Modal(() => this.#onModalClose());

    this.#addEventListeners();
    this.#node.append(pageContent, this.#modal.node);
    
    db.getStoreItems('tasks').then(tasks => {
      this.#tasksLists = new MultiTaskLists(tasks);
      pageContent.appendChild(this.#tasksLists.node);
    });
  }
  
  #createHeader() {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'inbox';
    
    header.appendChild(title);
    return header;
  }
    
  #openModal(task={}) {
    this.#modalContent.render(task);
    bus.emit(EVENTS.MODAL.OPEN, this.#modalContent.node);
    this.#node.querySelector('.inbox-content').setAttribute('inert', '');
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
    this.#node.querySelector('.inbox-content').removeAttribute('inert');
    this.#node.querySelector('.add-btn').focus();
  }

  #addEventListeners() {
    bus.on(
      EVENTS.TASKS_LIST.TASK_DETAILS, 
      (id) => {
        db.getEntity('tasks', id).then((task) => this.#openModal(task));
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.TASK.SAVE, 
      (task) => {
        if (task.id) this.#tasksLists.save(task);
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.TASK.DELETE,
      (id) => this.#tasksLists.deleteTask(id),
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.DATABASE.TASK_ADDED, 
      (task) => this.#tasksLists.save(task),
      {clearOnReload: true}
    );
  }

  get node() {
    return this.#node;
  }
}
