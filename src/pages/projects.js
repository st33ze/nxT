import './projects.css';
import { createNode } from '../utils/domUtils.js';
import AddButton from '../components/common/addButton.js';
import db from '../utils/dbManager.js';
import ProjectList from '../components/common/projectList.js';
import bus, {EVENTS} from '../utils/bus.js';
import Modal from '../components/modals/modal.js';
import ProjectModal from '../components/modals/projectModal.js';

const testProject = {
  id: 1,
  title: "To ensure that the title is vertically centered and to add ellipsis",
  description: "A software development project for a client in the healthcare industry. The project involves creating a web application for managing patient records, appointments, and billing.",
  tasks: [
    {
      id: 1,
      title: "Finish project report",
      description: "Complete the final detailed report for the ABC project, which includes financial data, project milestones, and lessons learned. Ensure the report is formatted properly and reviewed before submission to the management team.",
      date: "2025-01-24",
      priority: "high",
      completed: false,
      projectId: 1,
    },
    {
      id: 2,
      title: "Grocery shopping",
      description: "Go to the local supermarket to buy fresh vegetables, seasonal fruits, dairy products, and other weekly essentials. Also, check for discounts on household items like cleaning supplies.",
      date: "2025-01-25",
      priority: "medium",
      completed: true,
      projectId: 1,
    },
    {
      id: 3,
      title: "Call with the client",
      description: "Set up a one-hour video call with the client to discuss progress on the project milestones. Prepare a brief update presentation, including timelines, current challenges, and proposed solutions.",
      date: "2025-01-26",
      priority: "high",
      completed: false,
      projectId: 1,
    },
  ]
}


export default class Projects {
  #node;
  #projectList;
  #modal

  constructor() {
    this.#node = createNode('div', {'class': 'page-projects'});
    
    const pageContent = createNode('div', {class: 'projects-content'});
    const header = this.#createHeader();
    const newProjectBtn = this.#createNewProjectBtn().node;
    pageContent.append(header, newProjectBtn);

    this.#modal = {
      window: new Modal(this.#onModalClose.bind(this)),
      content: new ProjectModal(),
    }

    this.#node.append(pageContent, this.#modal.window.node);

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
    this.#modal.content.render(project);
    console.log(this.#modal.content);
    bus.emit(EVENTS.MODAL.OPEN, this.#modal.content.node);
    this.#node.querySelector('.projects-content').setAttribute('inert', '');
  }

  #createNewProjectBtn() {
    const button = new AddButton();
    button.label = 'Create new project';
    button.addEventListener('click', () => this.#openModal());

    return button;
  }

  #onModalClose() {
    const content = this.#node.querySelector('.projects-content');
    content.removeAttribute('inert');
    content.querySelector('.add-btn').focus();
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