import './projectModal.css';
import { createNode } from '../../utils/domUtils.js';
import ContentEditable from './components/ContentEditable.js';
import { createSVGElement } from '../../assets/icons.js';
import { TaskList } from '../common/taskList.js';
import ProgressIndicator from '../common/ProgressIndicator.js';
import bus, { EVENTS } from '../../utils/bus.js';

class TaskSection {
  #node;
  #taskList;
  #projectId

  constructor() {
    this.#node = createNode('div', { class: 'task-section' });
    
    this.#taskList = new TaskList();

    this.#node.append(this.#createHeader(), this.#taskList.node);

    this.#addTaskListListeners();
  }

  #createHeader() {
    const header = createNode('div', { class: 'task-section--header'} );
    header.append(
      createNode('h3'), 
      createSVGElement('arrow'),
      ProgressIndicator.create()
    );
    header.addEventListener('click', () => {
      this.#node.style.interpolateSize = 'allow-keywords';
      this.#node.classList.toggle('expanded');
      
      this.#node.addEventListener('transitionend', () => {
        this.#node.removeAttribute('style');
      }, { once: true });

    });
    
    return header;
  }

  #addTaskListListeners() {
    bus.on(
      EVENTS.TASK.EDIT,
      (task) => {
        if (task.projectId === this.#projectId) {
          this.#taskList.save(task);
        } else {
          this.#taskList.delete(task.id);
        }
        this.#updateHeader();
      },
      {clearOnReload: true}
    );
  }

  #updateHeader() {
    const completionList = this.#taskList.getCompletionList();

    const count = completionList.length;
    this.#node.querySelector('h3').textContent = `${count} task${count === 1 ? '' : 's'}`;

    ProgressIndicator.update(
      this.#node.querySelector('.project-progress'),
      completionList
    );
  }

  renderTasks(tasks, projectId) {
    this.#projectId = projectId;

    this.#taskList.render(tasks);

    this.#updateHeader();
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

  #adjustButtons(isNewProject) {
    this.#buttons.save.disabled = isNewProject;
    this.#buttons.delete.style.display = isNewProject ? 'none': 'block';
    this.#buttons.addTask.style.display = isNewProject ? 'none': 'block';
  }

  render(project={}) {
    this.#adjustButtons(!project.hasOwnProperty('title'));

    for (const input in this.#inputs) {
      this.#inputs[input].value = project[input];
    }

    this.#taskSection.renderTasks(project.tasks, project.id);
  }

  get node() {
    return this.#node;
  }

}