import { createNode } from '../utils/domUtils.js';
import { createHeader, isModalOpen, openModal } from '../utils/pageUtils.js';
import { getTodayStringDate, isTodayDate } from '../utils/taskUtils.js';
import AddButton from '../components/common/addButton.js';
import { TaskList } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
import db from '../utils/dbManager.js';
import Modal, { MODAL_CONTENT } from '../components/modals/modal.js';

export default class Today {
  #node
  #taskList

  constructor() {
    this.#node = createNode('div', {'class': 'page'});

    const pageContent = createNode('div', {class: 'page-content'});
    const addButton = new AddButton(
      'Add a task',
      () => {
        if (isModalOpen()) return;
        openModal(MODAL_CONTENT.TASK, {date: getTodayStringDate()})
      }
    );
    pageContent.append(createHeader('today'), addButton.node);

    this.#addEventListeners();
    this.#node.append(pageContent, new Modal().node);
    
    this.#loadTasksFromDB().then((tasks) => {
      this.#taskList = new TaskList(tasks);
      pageContent.appendChild(this.#taskList.node);
    }).catch((error) => {
      console.error('Error loading tasks:', error);
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
      (task) => {
        if (isTodayDate(task.date)) {
          this.#taskList.save(task);
        } else {
          this.#taskList.delete(task.id);
        }
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.DATABASE.TASK_ADDED, 
      (task) => {
        if (isTodayDate(task.date)) this.#taskList.save(task);
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.TASK.DELETE,
      (taskId) => this.#taskList.delete(taskId),
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