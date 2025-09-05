import { createNode } from '../utils/domUtils.js';
import { createHeader, isModalOpen, openModal } from '../utils/pageUtils.js';
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
    const addButton = new AddButton(
      'Add a task', 
      () => {
        if (isModalOpen()) return;
        openModal(MODAL_CONTENT.TASK);
      }
    );
    pageContent.append(createHeader('inbox'), addButton.node);

    this.#addEventListeners();
    this.#node.append(pageContent, new Modal().node);
    
    db.getStoreItems('tasks').then(tasks => {
      this.#tasksLists = new MultiTaskLists(tasks);
      pageContent.appendChild(this.#tasksLists.node);
    });
  }
  
  #addEventListeners() {
    bus.on(
      EVENTS.TASKS_LIST.TASK_DETAILS, 
      (id) => {
        if (isModalOpen()) return;
        db.getEntity('tasks', id).then((task) => openModal(MODAL_CONTENT.TASK, task));
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.TASK.EDIT,
      (task) => this.#tasksLists.save(task),
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
