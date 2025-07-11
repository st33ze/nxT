import { createNode } from '../utils/domUtils.js';
import { createHeader } from '../utils/pageUtils.js';
import AddButton from '../components/common/addButton.js';
import { MultiTaskLists } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
import db from '../utils/dbManager.js';
import Modal, { MODAL_CONTENT } from '../components/modals/modal.js';

export default class Inbox {
  #node
  #tasksLists

  constructor() {
    this.#node = createNode('div', {'class': 'page'});

    const pageContent = createNode('div', {class: 'page-content'});
    pageContent.append(createHeader('inbox'), this.#createNewTaskBtn());

    this.#addEventListeners();
    this.#node.append(pageContent, new Modal().node);
    
    db.getStoreItems('tasks').then(tasks => {
      this.#tasksLists = new MultiTaskLists(tasks);
      pageContent.appendChild(this.#tasksLists.node);
    });
  }
  
  #openModal(task={}) {
    const caller = document.activeElement;
    bus.emit(EVENTS.MODAL.OPEN, {type: MODAL_CONTENT.TASK, data: task});
    const content =  this.#node.querySelector('.inbox-content');
    content.setAttribute('inert', '');

    bus.on(
      EVENTS.MODAL.CLOSE, 
      () => {
        content.removeAttribute('inert');
        caller?.focus();    
      },
      {clearOnReload: true, once: true}
    );
  }

  #createNewTaskBtn() {
    const button = new AddButton();
    button.label = 'Add a task';
    button.addEventListener('click', () => this.#openModal());
    
    return button.node;
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
