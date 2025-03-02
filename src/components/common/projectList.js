import './projectList.css';
import { createNode } from '../../utils/domUtils.js';
import { sortByProgress } from '../../utils/projectUtils.js';
import ProgressIndicator from './ProgressIndicator.js';

class ProjectCard {
  static create(project) {
    const card = createNode('article', {class: 'project-card'});
    
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
    this.#projects = sortByProgress(projects);
    projects.forEach((project) => {
      this.#node.appendChild(ProjectCard.create(project));
    });
  }

  get node() {
    return this.#node;
  }
}