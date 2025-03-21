import './projectModal.css';
import { createNode, normalizeInputValue } from '../../utils/domUtils.js';
import ContentEditable from './components/ContentEditable.js';
import { createSVGElement } from '../../assets/icons.js';
import { TaskList } from '../common/taskList.js';
import ProgressIndicator from '../common/ProgressIndicator.js';
import bus, { EVENTS } from '../../utils/bus.js';
import { calcProgress } from '../../utils/projectUtils.js';
import { MODAL_CONTENT } from './modal.js';

class TaskSection {
  #node;
  #taskList;
  #projectId

  constructor() {
    this.#node = createNode('div', {
      class: 'task-section',
      'aria-expanded': 'false',
    });
    
    this.#taskList = new TaskList();

    this.#node.append(this.#createHeader(), this.#taskList.node);

    this.#addTaskListListeners();
  }

  #createHeader() {
    const header = createNode('div', {
      class: 'task-section--header',
      role: 'button',
      tabindex: '0',
      'aria-label': 'Show tasks',
    });
    header.append(
      createNode('h3'), 
      createSVGElement('arrow'),
      ProgressIndicator.create()
    );

    function toggleAccordtion() {
      this.#node.style.interpolateSize = 'allow-keywords';
      
      const isExpanded = this.#node.classList.contains('expanded');
      this.#node.classList.toggle('expanded', !isExpanded);
      this.#node.setAttribute('aria-expanded', !isExpanded);
      
      const label = isExpanded ? 'Show tasks': 'Hide tasks';
      header.setAttribute('aria-label', label);
      
      this.#node.addEventListener('transitionend', () => {
        this.#node.removeAttribute('style');
      }, { once: true });
    }

    header.addEventListener('click', toggleAccordtion.bind(this));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key   === ' ') {
        e.preventDefault();
        toggleAccordtion.call(this);
      }
    });
    
    return header;
  }

  #updateHeader(taskCount, projectProgress) {
    const headerText = `${taskCount} task${taskCount === 1 ? '': 's'}`;
    this.#node.querySelector('h3').textContent = headerText;

    ProgressIndicator.update(
      this.#node.querySelector('.project-progress'),
      projectProgress
    );
  }

  #handleTaskListChange() {
    const completionList = this.#taskList.getCompletionList();
    const progress = completionList.length ? calcProgress(completionList): null;    
    
    this.#updateHeader(completionList.length, progress);

    bus.emit(
      EVENTS.PROJECT_MODAL.PROGRESS_CHANGE,
      {id: this.#projectId, progress}
    );
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
        this.#handleTaskListChange();
      },
      {clearOnReload: true}
    );
    
    bus.on(
        EVENTS.TASK.DELETE,
        (id) => {
          this.#taskList.delete(id);
          this.#handleTaskListChange();
        },
        {clearOnReload: true}
    )

    bus.on(
      EVENTS.TASK.CREATE,
      (task) => {
        if (task.projectId === this.#projectId) {
          this.#taskList.save(task);
          this.#handleTaskListChange();
        }
      },
      {clearOnReload: true}
    );
  }

  renderTasks(tasks, projectId) {
    this.#projectId = projectId;

    this.#taskList.render(tasks);

    if (tasks) {
      this.#updateHeader(
        tasks.length,
        calcProgress(tasks.map(task => task.completed))
      );
    }
  }

  get node() {
    return this.#node;
  }
}

export default class ProjectModal {
  #node;
  #inputs;
  #buttons;
  #taskSection;
  #id;

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

  #isProjectNew() {
    return !this.#id;
  }

  #createButtonPanel() {
    const buttonPanel = createNode('div', { class: 'button-panel' });
    
    const saveBtn = createNode('button', {
      class: 'save-btn',
      disabled: true,
    });
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      if (this.#isProjectNew()) {
        bus.emit(EVENTS.PROJECT.CREATE, this.project);
      } else {
        bus.emit(EVENTS.PROJECT.EDIT, this.project);
      }
      bus.emit(EVENTS.MODAL.CONTENT_CLOSE);
    });

    const deleteBtn = createNode('button', { 
      class: 'delete-btn',
      'aria-label': 'Delete project',
    });
    deleteBtn.appendChild(createSVGElement('delete'));
    deleteBtn.addEventListener('click', () => {
      bus.emit(EVENTS.PROJECT.DELETE, this.project.id);
      bus.emit(EVENTS.MODAL.CONTENT_CLOSE);
    });

    const addTaskBtn = createNode('button', {
      class: 'add-task--btn',
      'aria-label': 'Add new task'
    });
    addTaskBtn.appendChild(createSVGElement('addTask'));
    addTaskBtn.addEventListener('click', () => {
      bus.emit(EVENTS.MODAL.OPEN, {
        type: MODAL_CONTENT.TASK, 
        data: {projectId: this.#id}
      });
    });
    
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

  #adjustButtons(isProjectNew) {
    this.#buttons.save.disabled = isProjectNew;
    this.#buttons.delete.style.display = isProjectNew ? 'none': 'block';
    this.#buttons.addTask.style.display = isProjectNew ? 'none': 'block';
  }

  render(project={}) {
    this.#id = project.id;
    this.#adjustButtons(this.#isProjectNew());

    for (const input in this.#inputs) {
      this.#inputs[input].value = project[input];
    }

    this.#taskSection.renderTasks(project.tasks, project.id);
  }

  get project() {
    const project = {};
    for (const key in this.#inputs) {
      project[key] = normalizeInputValue(this.#inputs[key].value);
    }
    if (this.#id) project.id = this.#id;

    return project;
  }

  get node() {
    return this.#node;
  }

}