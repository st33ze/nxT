import './today.css';
import { createNode } from '../utils/domUtils.js';
import AddButton from '../components/common/addButton.js';
import Modal from '../components/modals/modal.js';
import TaskModal from '../components/modals/taskModal.js';
import { TaskList } from '../components/common/taskList.js';
import bus, { EVENTS } from '../utils/bus.js';
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
    const newTaskBtn = this.#createNewTaskBtn().node;
    pageContent.append(header, newTaskBtn);

    this.#modalContent = new TaskModal();
    this.#modal = new Modal(() => this.#onModalClose());

    this.#addEventListeners();
    this.#node.append(pageContent, this.#modal.node);
    
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
    this.#modalContent.render(task);
    bus.emit(EVENTS.MODAL.OPEN, this.#modalContent.node);
    this.#node.querySelector('.today-content').setAttribute('inert', '');
  }

  #createNewTaskBtn() {
    const button = new AddButton();
    button.label = 'Add a task';
    button.addEventListener('click', () => this.#openModal());
    
    return button;
  }
  
  #onModalClose() {
    this.#node.querySelector('.today-content').removeAttribute('inert');
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