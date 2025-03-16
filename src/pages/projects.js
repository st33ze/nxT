import './projects.css';
import { createNode } from '../utils/domUtils.js';
import AddButton from '../components/common/addButton.js';
import db from '../utils/dbManager.js';
import ProjectList from '../components/common/projectList.js';
import bus, {EVENTS} from '../utils/bus.js';
import Modal, {MODAL_CONTENT} from '../components/modals/modal.js';

export default class Projects {
  #node;
  #projectList;

  constructor() {
    this.#node = createNode('div', {'class': 'page-projects'});
    
    const pageContent = createNode('div', {class: 'projects-content'});
    pageContent.append(this.#createHeader(), this.#createNewProjectBtn());

    this.#addEventListeners();
    this.#node.append(pageContent, new Modal().node);

    this.#loadProjectsFromDB().then((projects) => {
      this.#projectList = new ProjectList(projects);
      pageContent.appendChild(this.#projectList.node);
    }
    ).catch((error) => {
      console.error('Error loading projects:', error);
    });
  }

  #createHeader() {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'projects';
    
    header.appendChild(title);
    return header;
  }

  #openModal(project={}) {
    bus.emit(EVENTS.MODAL.OPEN, {type: MODAL_CONTENT.PROJECT, data: project});
    const content = this.#node.querySelector('.projects-content');
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

  #createNewProjectBtn() {
    const button = new AddButton();
    button.label = 'Create new project';
    button.addEventListener('click', () => this.#openModal());

    return button.node;
  }

  #addEventListeners() {
    bus.on(
      EVENTS.PROJECT_LIST.PROJECT_DETAILS, 
      (id) => {
        Promise.all([
          db.getEntity('projects', id),
          db.getTasksByIndex('byProjectId', id)
        ]).then(([project, tasks]) => {
          project.tasks = tasks;
          this.#openModal(project);
        }).catch(error => {
          console.error('Error fetching project details', error);
        });
      },
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.PROJECT_MODAL.PROGRESS_CHANGE,
      (project) => this.#projectList.save(project),
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.DATABASE.PROJECT_ADDED,
      (project) => this.#projectList.save(project),
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.PROJECT.DELETE,
      (id) => this.#projectList.delete(id),
      {clearOnReload: true}
    );

    bus.on(
      EVENTS.PROJECT.EDIT,
      (project) => this.#projectList.save(project),
      {clearOnReload: true}
    )
  }

  async #loadProjectsFromDB() {
    const projects = await db.getStoreItems('projects');
    const getTasks = projects.map(async (project) => {
      const tasks = await db.getTasksByIndex('byProjectId', project.id);
      project.tasks = tasks;
      return project;      
    });
    
    return Promise.all(getTasks);
  }

  get node() {
    return this.#node;
  }
}