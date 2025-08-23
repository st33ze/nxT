import './taskModal.css';
import { createNode } from '../../utils/domUtils.js';
import ContentEditable from './components/ContentEditable.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, { EVENTS } from '../../utils/bus.js';
import SelectField from '../common/SelectField.js';
import db from '../../utils/dbManager.js';

class TaskInput {
  #button;
  #field;

  constructor(button, field) {
    this.#button = button;
    this.#field = field;
  }

  static createButton(iconName, textContent) {
    const button = createNode('button', {
      'aria-expanded': 'false',
      'aria-controls': `task-${textContent.toLowerCase()}-input`,
    });
    
    const icon = createNode('span', {'aria-hidden': 'true'});
    icon.appendChild(createSVGElement(iconName));
    
    const text = createNode('span');
    text.textContent = textContent;
    
    button.append(icon, text);
    
    return button;
  }

  toggle() {
    this.field.toggleAttribute('hidden');
    this.button.setAttribute('aria-expanded', String(!this.field.hidden));
  }

  // /** @param {string} value */
  set value(value) {
    this.#field.value = value;
  }

  get value() {
    return this.#field.value;
  }

  get button() {
    return this.#button;
  }

  get field() {
    return this.#field instanceof HTMLElement ? this.#field : this.#field.node;
  }

  get fieldObject() {
    if (!(this.#field instanceof HTMLElement)) return this.#field;
  }
}

class TaskDate extends TaskInput {
  #label;

  constructor() {
    super(TaskInput.createButton('today', 'Date'), TaskDate.#createField());
    this.#label = this.#createLabel();

    this.field.addEventListener('change', () => {
      this.field.classList.toggle('input-filled', this.field.value);
      this.button.classList.toggle('input-filled', this.field.value);
    });
  }

  #createLabel() {
    const label = createNode('label', { for: 'task-date-input', hidden: '' });
    label.textContent = 'Task date:';
    return label;
  }

  static #createField() {
    const input = createNode('input', {
      id: 'task-date-input',
      type: 'date',
      hidden: '',
    });

    return input;
  }

  toggle() {
    this.label.toggleAttribute('hidden');
    super.toggle();
  }

  /** @param {string} date */
  set value(date) {
    this.field.value = date ?? '';
    this.field.dispatchEvent(new Event('change'));
  }

  get value() {
    return this.field.value;
  }

  get label() {
    return this.#label;
  }
}

class TaskPriority extends TaskInput {
  static PRIORITY_OPTIONS = ['low', 'medium', 'high'];

  constructor() {
    super(
      TaskInput.createButton('priority', 'Priority'),
      TaskPriority.#createField()
    );

    this.field.addEventListener('change', (e) => {
      this.button.dataset.priority = e.detail.value || '';
    });
  }

  static #createField() {
    const field = new SelectField(
      TaskPriority.PRIORITY_OPTIONS.map(option => ({ value: option }))
    );
    field.node.hidden = true;

    return field;
  }
}

class TaskProject extends TaskInput {
  constructor() {
    super(
      TaskInput.createButton('projects', 'Project'),
      TaskProject.#createField()
    );

    this.field.addEventListener('change', (e) => {
      this.button.classList.toggle('input-filled', e.detail.value);
    });
  }

  static #createField() {
    const field = new SelectField();
    field.node.hidden = true;
    field.node.classList.add('project-select');

    return field;
  }

  #loadProjects() {
    return db.getStoreItems('projects');
  }

  async init() {
    const projects = await this.#loadProjects();
    this.fieldObject.populate(
      projects.map(project => ({
        value: project.id,
        label: project.title,
      }))
    );
  }

  set value(projectID) {
    this.fieldObject.value = projectID;
  }

  get value() {
    return this.fieldObject.value ? Number(this.fieldObject.value) : null;
  }
}

class TaskCheckbox {
  #node;

  constructor() {
    this.#node = createNode('input', {
      type: 'checkbox',
      class: 'task-checkbox',
      'aria-label': 'Task completed'
    });
  }

  set value(newValue) {
    this.#node.checked = newValue;
  }

  get value() {
    return this.#node.checked;
  }

  get node() {
    return this.#node;
  }
}

const INPUT_TO_TASK_KEY = {
  title: 'title',
  description: 'description',
  date: 'date',
  priority: 'priority',
  project: 'projectId',
  completed: 'completed',
};

export default class TaskModal {
  #node;
  #inputs;
  #buttons;
  #id;

  constructor() {
    this.#node = createNode('div', { class: 'task-modal' });
  }

  async #createInputs() {
    const title = new ContentEditable('h2', {
      placeholder: 'Task title',
      'aria-required': 'true',
    });
    title.addEventListener('blur', () => {
      this.#buttons.save.disabled = !title.node.textContent.trim();
    });

    const description = new ContentEditable('p', {
      placeholder: 'Task description',
    });

    const date = new TaskDate();
    const priority = new TaskPriority();
    const project = new TaskProject();
    const completed = new TaskCheckbox();

    await project.init();

    this.#inputs = { title, description, date, priority, project, completed };
  }


  #createInputPanel() {
    const panel = createNode('div', { class: 'input-panel' });
    const inputs = [
      this.#inputs.date,
      this.#inputs.priority,
      this.#inputs.project,
    ];

    const buttonContainer = createNode('div', { class: 'input-panel--buttons' });
    const inputContainer = createNode('div', { class: 'input-panel--inputs', hidden: '' });
    
    for (const input of inputs) {
      buttonContainer.appendChild(input.button);
      if (input.label) inputContainer.appendChild(input.label);
      inputContainer.appendChild(input.field);
    }

    panel.append(buttonContainer, inputContainer);

    panel.addEventListener('click', (e) => {
      const button = e.target.closest('.input-panel--buttons button');
      if (!button) return;
        
      const activeInput = inputs.find(input => !input.field.hidden);
      const input = inputs.find(input => input.button === button);
      
      activeInput?.toggle();

      if (input !== activeInput) input.toggle();

      inputContainer.hidden = input.field.hidden;    
    });

    return panel;
  }

  #isTaskNew() {
    return this.#node.classList.contains('new-task');
  }

  #createBottomPanel() {
    const panel = createNode('div', { class: 'bottom-panel' });

    const saveBtn = createNode('button', {
      class: 'save-btn',
      disabled: true,
    });
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      if (this.#isTaskNew()) {
        bus.emit(EVENTS.TASK.CREATE, this.task);
      } else {
        bus.emit(EVENTS.TASK.EDIT, this.task);
      }
      bus.emit(EVENTS.MODAL.CONTENT_CLOSE);
    });

    const deleteBtn = createNode('button', {
      class: 'delete-btn',
      'aria-label': 'Delete task',
    });
    deleteBtn.appendChild(createSVGElement('delete'));
    deleteBtn.addEventListener('click', () => {
      bus.emit(EVENTS.TASK.DELETE, this.#id);
      bus.emit(EVENTS.MODAL.CONTENT_CLOSE);
    });

    panel.append(this.#inputs.completed.node, deleteBtn, saveBtn);
    this.#buttons = { save: saveBtn, delete: deleteBtn };
    return panel;
  }

  async init() {
    await this.#createInputs();

    const textSection = createNode('div', { class: 'text-section' });
    const {title, description} = this.#inputs;
    textSection.append(title.node, description.node);
    
    this.#node.append(textSection, this.#createInputPanel(), this.#createBottomPanel());
  }

  #fillInputs(task) {
    for (const key in this.#inputs)
      this.#inputs[key].value = task[INPUT_TO_TASK_KEY[key]];
  }

  render(task = {}) {
    this.#node.classList.toggle('new-task', task.id == null);
    this.#buttons.save.disabled = this.#isTaskNew();
    this.#id = task.id;

    this.#fillInputs(task);
  }

  get task() {
    const task = {};
    for (const key in this.#inputs) {
      task[INPUT_TO_TASK_KEY[key]] = this.#inputs[key].value;
    }
    if (!this.#isTaskNew()) {
      task.id = this.#id;
    }

    return task;
  }

  get node() {
    return this.#node;
  }
}