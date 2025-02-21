import './projectList.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';

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

    const completedTasks = tasks.filter(task => task.completed).length;
    node.parentElement.classList.toggle('project-completed', completedTasks === tasks.length);

    if (completedTasks === tasks.length) {
      const completedIcon = createSVGElement('done');
      node.appendChild(completedIcon);
      node.setAttribute('aria-label', 'Project completed');
    } else {
      const innerCircle = createNode('div');
      node.appendChild(innerCircle);
      innerCircle.style.setProperty('--progress', `${completedTasks / tasks.length * 100}`);
      node.setAttribute('aria-label', `${completedTasks} of ${tasks.length} tasks completed`);
    }
  }
}

export default class ProjectList {
  #node;
  #projects

  constructor(projects = []) {
    this.#node = createNode('section', {class: 'project-list'});
    this.#projects = projects;

    projects.forEach((project) => {
      this.#node.appendChild(ProjectCard.create(project));
    });

  }

  get node() {
    return this.#node;
  }
}