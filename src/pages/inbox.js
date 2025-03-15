import './inbox.css';
import { createNode } from '../utils/domUtils.js';
import AddButton from '../components/common/addButton.js';
import Modal from '../components/modals/modal.js';
import TaskModal from '../components/modals/taskModal.js';
import { MultiTaskLists } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
import db from '../utils/dbManager.js';

export default class Inbox {
  #node
  #modalContent
  #modal
  #tasksLists

  constructor() {
    this.#node = createNode('div', {'class': 'page-inbox'});

    const pageContent = createNode('div', {class: 'inbox-content'});

    this.#modalContent = new TaskModal();
    this.#modal = new Modal();
    pageContent.append(this.#createHeader(), this.#createNewTaskBtn());

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

    bus.on(
      EVENTS.MODAL.CLOSE, 
      () => this.#onModalClose(),
      {clearOnReload: true, once: true}
    );
  }

  #createNewTaskBtn() {
    const button = new AddButton();
    button.label = 'Add a task';
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
