import { createNode } from '../utils/domUtils.js';
import { createHeader, openModal } from '../utils/pageUtils.js';
import AddButton from '../components/common/addButton.js';
import db from '../utils/dbManager.js';
import ProjectList from '../components/common/projectList.js';
import bus, {EVENTS} from '../utils/bus.js';
import Modal, {MODAL_CONTENT} from '../components/modals/modal.js';

export default class Projects {
  #node;
  #projectList;

  constructor() {
    this.#node = createNode('div', {'class': 'page'});
    
    const pageContent = createNode('div', {class: 'page-content'});
    pageContent.append(createHeader('projects'), this.#createNewProjectBtn());

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

  #createNewProjectBtn() {
    const button = new AddButton();
    button.label = 'Create new project';
    button.addEventListener('click', () => openModal(MODAL_CONTENT.PROJECT));

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
          openModal(MODAL_CONTENT.PROJECT, project);
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