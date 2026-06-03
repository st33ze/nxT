import { createNode } from '../utils/domUtils.js';
import { createHeader, isModalOpen, openModal } from '../utils/pageUtils.js';
import AddButton from '../components/common/addButton.js';
import { MultiTaskLists } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
import db from '../utils/dbManager.js';
import Modal, { MODAL_CONTENT } from '../components/modals/modal.js';
import EmptyState from '../components/common/EmptyState.js';
import ListContainer from '../components/common/ListContainer.js';

export default class Inbox {
  #node
  #tasksLists
  #listContainer

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

    this.#node.append(pageContent, new Modal().node);
    
    this.#addEventListeners();
    this.#generateTaskList(); 
  }
  
  async #generateTaskList() {
    try {
      const tasks = await db.getStoreItems('tasks');
      this.#tasksLists = new MultiTaskLists(tasks);
      
      const emptyState = new EmptyState({
        title: 'No Tasks Yet',
        description: 'You\'re all cought up! Start by adding a new task'
      });
      this.#listContainer = new ListContainer(this.#tasksLists, emptyState);

      this.#node.querySelector('.page-content').append(this.#listContainer.node);
    } catch(error) {
      console.error('Failed to load tasks', error);
    }
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
      (id) => {
        this.#tasksLists.deleteTask(id);
        this.#listContainer.sync();
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.DATABASE.TASK_ADDED, 
      (task) => {
        this.#tasksLists.save(task);
        this.#listContainer.sync();
      },
      {clearOnReload: true}
    );
  }

  get node() {
    return this.#node;
  }
}
