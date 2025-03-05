import './projectList.css';
import { createNode } from '../../utils/domUtils.js';
import { sortByProgress } from '../../utils/projectUtils.js';
import ProgressIndicator from './ProgressIndicator.js';
import bus, { EVENTS } from '../../utils/bus.js';

class ProjectCard {
  static create(project) {
    const card = createNode('article', {
      class: 'project-card',
      'data-project-id': project.id
    });
    
    card.append(
      createNode('h2', {class: 'project-title'}),
      ProgressIndicator.create()
    );
    
    ProjectCard.update(card, project);

    return card;
  }

  static update(card, project) {
    card.querySelector('.project-title').textContent = project.title;

    card.classList.toggle('no-tasks', project.tasks.length === 0);
    ProgressIndicator.update(
      card.querySelector('.project-progress'),
      project.tasks
    );
  }
}

export default class ProjectList {
  #node;
  #projects

  constructor(projects = []) {
    this.#node = createNode('section', {class: 'project-list'});

    // To be checked if map is really needed here
    this.#projects = new Map(projects.map(project => [project.id, project]));
    
    sortByProgress(projects)
      .forEach((project) => {
        this.#node.appendChild(ProjectCard.create(project));
      });

    this.#node.addEventListener('click', this.#handleClickEvent);
  }

  #handleClickEvent = (e) => {
    const projectItem = e.target.closest('article');
    if (!projectItem) return;

    const id = Number(projectItem.getAttribute('data-project-id'));

    bus.emit(EVENTS.PROJECT_LIST.PROJECT_DETAILS, id);
  }

  get node() {
    return this.#node;
  }
}