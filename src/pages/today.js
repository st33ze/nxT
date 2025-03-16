import './today.css';
import { createNode } from '../utils/domUtils.js';
import AddButton from '../components/common/addButton.js';
import { TaskList } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
import db from '../utils/dbManager.js';
import Modal, { MODAL_CONTENT } from '../components/modals/modal.js';

export default class Today {
  #node
  #taskList

  constructor() {
    this.#node = createNode('div', {'class': 'page-today'});

    const pageContent = createNode('div', {class: 'today-content'});
    pageContent.append(this.#createHeader(), this.#createNewTaskBtn());

    this.#addEventListeners();
    this.#node.append(pageContent, new Modal().node);
    
    this.#loadTasksFromDB().then((tasks) => {
      this.#taskList = new TaskList(tasks);
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
    bus.emit(EVENTS.MODAL.OPEN, {type: MODAL_CONTENT.TASK, data: task});
    
    const content = this.#node.querySelector('.today-content');
    content.setAttribute('inert', '');

    bus.on(
      EVENTS.MODAL.CLOSE, 
      () => {
        content.removeAttribute('inert');
        content.querySelector('.add-btn').focus();    
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
        if (task.id) {
          task.date === this.#getTodayStringDate()
            ? this.#taskList.save(task)
            : this.#taskList.delete(task.id);
        }
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.DATABASE.TASK_ADDED, 
      (task) => {
        if (task.date === this.#getTodayStringDate()) 
          this.#taskList.save(task);
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
    const dateString = this.#getTodayStringDate();
    const tasks = await db.getTasksByIndex('byDate', dateString);

    return tasks;
  }

  get node() {
    return this.#node;
  }
}