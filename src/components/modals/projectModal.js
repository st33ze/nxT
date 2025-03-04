import './projectModal.css';
import { createNode } from '../../utils/domUtils.js';
import ContentEditable from './components/ContentEditable.js';
import { createSVGElement } from '../../assets/icons.js';
import { TaskList } from '../common/taskList.js';
import ProgressIndicator from '../common/ProgressIndicator.js';

class TaskSection {
  #node;
  #taskList;

  constructor() {
    this.#node = createNode('div', { class: 'task-section' });
    
    this.#node.appendChild(this.#createHeader());
  }

  #createHeader() {
    const header = createNode('div', { class: 'task-section--header'} );
    header.append(
      createNode('h3'), 
      createSVGElement('arrow'),
      ProgressIndicator.create()
    );
    header.addEventListener('click', () => this.#node.classList.toggle('expanded'));
    
    return header;
  }

  #addTaskListListeners() {}

  #updateHeader(tasks) {
    const count = tasks.length;
    this.#node.querySelector('h3').textContent = `${count} task${count === 1 ? '' : 's'}`;

    ProgressIndicator.update(
      this.#node.querySelector('.project-progress'),
      tasks
    )
  }

  renderTasks(tasks) {
    this.#taskList?.node.remove();
    this.#taskList = new TaskList(tasks);
    this.#node.appendChild(this.#taskList.node);

    this.#updateHeader(tasks);
  }

  get node() {
    return this.#node;
  }
}

export default class ProjectModal {
  #node;
  #inputs;
  #buttons;
  #taskSection

  constructor() {
    this.#node = createNode('div', { class: 'project-modal' });

    this.#init();
  }
  
  #createInputs() {
    const title = new ContentEditable('h2', {
      placeholder: 'Project title',
    });
    title.addEventListener('blur', () => {
      this.#buttons.save.disabled = !title.node.textContent.trim();
    });
    
    const description = new ContentEditable('p', {
      placeholder: 'Project description',
    });
    
    this.#inputs = {title, description};
  }

  #createButtonPanel() {
    const buttonPanel = createNode('div', { class: 'button-panel' });
    
    const saveBtn = createNode('button', {
      class: 'save-btn',
      disabled: true,
    });
    saveBtn.textContent = 'Save';

    const deleteBtn = createNode('button', { 
      class: 'delete-btn',
      'aria-label': 'Delete project',
    });
    deleteBtn.appendChild(createSVGElement('delete'));

    const addTaskBtn = createNode('button', {
      class: 'add-task--btn',
      'aria-label': 'Add new task'
    });
    addTaskBtn.appendChild(createSVGElement('addTask'));
    
    this.#buttons = {save: saveBtn, delete: deleteBtn, addTask: addTaskBtn};
    buttonPanel.append(addTaskBtn, deleteBtn, saveBtn);
    return buttonPanel;
  }

  #init() {
    this.#createInputs();
    
    const textSection = createNode('section', {class: 'text-section'});
    const {title, description} = this.#inputs;
    textSection.append(title.node, description.node);

    this.#taskSection = new TaskSection();

    this.#node.append(
      textSection,
      this.#taskSection.node,
      this.#createButtonPanel()
    );
  }

  render(project={}) {
    const isNewProject = !project.hasOwnProperty('title');
    this.#buttons.save.disabled = isNewProject;
    this.#buttons.delete.style.display = isNewProject ? 'none': 'block';

    for (const input in this.#inputs) {
      this.#inputs[input].value = project[input];
    }

    this.#taskSection.renderTasks(project.tasks);
  }

  get node() {
    return this.#node;
  }

}