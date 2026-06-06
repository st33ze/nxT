import { createNode } from '../utils/domUtils.js';
import { createHeader, isModalOpen, openModal } from '../utils/pageUtils.js';
import { getTodayStringDate, isTodayDate } from '../utils/taskUtils.js';
import AddButton from '../components/common/addButton.js';
import { TaskList } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
import db from '../utils/dbManager.js';
import Modal, { MODAL_CONTENT } from '../components/modals/modal.js';
import EmptyState from '../components/common/EmptyState.js';
import ListContainer from '../components/common/ListContainer.js';

export default class Today {
  #node
  #taskList
  #listContainer

  constructor() {
    this.#node = createNode('div', {'class': 'page'});

    const pageContent = createNode('div', { class: 'page-content' });

    const addTaskBtn = new AddButton(
      'Add a task',
      () => {
        if (isModalOpen()) return;
        openModal(MODAL_CONTENT.TASK, { date: getTodayStringDate() })
      }
    );

    pageContent.append(createHeader('today'), addTaskBtn.node);
    
    this.#node.append(pageContent, new Modal().node);

    this.#addEventListeners();
    this.#generateTaskList();
  }

  async #generateTaskList() {
    try {
      const tasks = await this.#loadTasksFromDB();
      this.#taskList = new TaskList(tasks);
  
      const emptyState = new EmptyState({
        title: 'No Tasks Yet',
        description: 'You\'re all cought up! Start by adding a new task'
      });
      this.#listContainer = new ListContainer(this.#taskList, emptyState);
  
      this.#node.querySelector('.page-content').append(this.#listContainer.node);
    } catch(error) {
      console.error('Error while loading tasks', error);
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
      (task) => {
        if (isTodayDate(task.date)) {
          this.#taskList.save(task);
        } else {
          this.#taskList.delete(task.id);
          this.#listContainer.sync();
        }
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.DATABASE.TASK_ADDED, 
      (task) => {
        if (isTodayDate(task.date)) this.#taskList.save(task);
        this.#listContainer.sync();
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.TASK.DELETE,
      (taskId) => {
        this.#taskList.delete(taskId);
        this.#listContainer.sync();
      },
      {clearOnReload: true}
    );
  }

  async #loadTasksFromDB() {
    const dateString = getTodayStringDate();
    const tasks = await db.getTasksByIndex('byDate', dateString);

    return tasks;
  }

  get node() {
    return this.#node;
  }
}