import './projectList.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import { calcProgress, sortByProgress } from '../../utils/projectUtils.js';

class ProjectCard {
  static create(project) {
    const card = createNode('article', {class: 'project-card'});
    
    const title = createNode('h2', {class: 'project-title'});
    const progress = createNode('div', {class: 'project-progress'});
    card.append(title, progress);
    
    ProjectCard.update(card, project);

    return card;
  }

  static update(card, project) {
    card.querySelector('.project-title').textContent = project.title;

    const progressIndicator = card.querySelector('.project-progress');
    ProjectCard.#updateProgressIndicatior(progressIndicator, project.tasks);
  }

  static #updateProgressIndicatior(node, tasks) {
    if (tasks.length === 0) {
      node.style.display = 'none';
      return;
    }
    
    node.innerHTML = '';
    node.style.display = 'block';

    const progress = calcProgress(tasks);
    const projectCompleted = progress === 1;
    node.parentElement.classList.toggle('project-completed', projectCompleted);

    if (projectCompleted) {
      const completedIcon = createSVGElement('done');
      node.appendChild(completedIcon);
      node.setAttribute('aria-label', 'Project completed');
    } else {
      const innerCircle = createNode('div');
      node.appendChild(innerCircle);
      innerCircle.style.setProperty('--progress', `${progress * 100}`);
      node.setAttribute('aria-label', `Project completed in ${progress * 100}%`);
    }
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