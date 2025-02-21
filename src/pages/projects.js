import './projects.css';
import { createNode } from '../utils/domUtils.js';
import AddButton from '../components/common/addButton.js';
import db from '../utils/dbManager.js';
import ProjectList from '../components/common/projectList.js';


export default class Projects {
  #node;
  #projectList;

  constructor() {
    this.#node = createNode('div', {'class': 'page-projects'});
    
    const pageContent = createNode('div', {class: 'projects-content'});
    const header = this.#createHeader();
    const newProjectBtn = this.#createNewProjectBtn().node;
    pageContent.append(header, newProjectBtn);

    this.#node.appendChild(pageContent);

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

  #createNewProjectBtn() {
    const button = new AddButton();
    return button;
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