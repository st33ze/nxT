import './projectModal.css';
import { createNode } from '../../utils/domUtils.js';
import ContentEditable from './components/ContentEditable.js';
import { createSVGElement } from '../../assets/icons.js';
import { TaskList } from '../common/taskList.js';

export default class ProjectModal {
  #node;
  #inputs;
  #buttons;

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
    
    this.#node.append(
      textSection,
      this.#createButtonPanel()
    );
  }

  #renderTaskList(tasks) {
    // delete previous task list
    const taskList = new TaskList(tasks);
    const buttonPanel = this.#node.querySelector('.button-panel');
    this.#node.insertBefore(taskList.node, buttonPanel);
  }

  render(project={}) {
    const isNewProject = !project.hasOwnProperty('title');
    this.#buttons.save.disabled = isNewProject;
    this.#buttons.delete.style.display = isNewProject ? 'none': 'block';

    for (const input in this.#inputs) {
      this.#inputs[input].value = project[input];
    }

    this.#renderTaskList(project.tasks);
  }

  get node() {
    return this.#node;
  }

}