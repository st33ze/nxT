import './taskModal.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, { EVENTS } from '../../utils/bus.js';

class ContentEditable {
  #node;

  constructor(tag, attributes) {
    this.#node = createNode(tag, {
      'class': 'contenteditable',
      'contenteditable': 'true',
      'spellcheck': 'false',
      ...attributes,
    });

    // Add blur event listener to handle empty content
    this.#node.addEventListener('blur', () => this.#handleBlur());
  }

  #handleBlur() {
    if (!this.#node.textContent.trim()) {
      this.#node.innerHTML = '';
    }
    bus.emit('task-input-change');
  }

  /**
   * @param {string} newValue - The new value for the input
   */
  set value(newValue) {
    this.#node.textContent = newValue || '';
  }

  get value() {
    return this.#node.textContent;
  }

  /**
   * Returns the root node of the task contenteditable component.
   * 
   * @returns {HTMLElement} The root node containing contenteditable element.
   */
  get node() {
    return this.#node;
  }
}

class TaskCheckbox {
  #node

  constructor() {
    this.#node = createNode('input', {
      'class': 'task-checkbox', 
      'type': 'checkbox', 
      'aria-label': 'Task completed'
    });
    this.#node.addEventListener('change', () => bus.emit('task-input-change'));
  }

  /**
   * @param {boolean} newValue - The new value for the input
   */
  set value(newValue) {
    this.#node.checked = newValue;
  }

  get value() {
    return this.#node.checked;
  }

  /**
   * Returns the node of the task checkbox component.
   * 
   * @returns {HTMLElement} The node of task checkbox input.
   */
  get node() {
    return this.#node;
  }
}

class TaskDate {
  #node;
  #input

  constructor() {
    this.#node = createNode('div', {'class': 'task-date'});
    this.#input = this.#createInput();
    this.#node.append(this.#createButton(), this.#input);
    this.#updateInputEmptyClass();
  }

  #createInput() {
    const input = createNode('input', {
      'type': 'date', 
      'tabindex': '-1', 
      'aria-label': 'Date'
    });
    input.addEventListener('change', () => {
      this.#updateInputEmptyClass();
      bus.emit('task-input-change');
    });
    return input;
  }

  #createButton() {
    const button = createNode('button', {'aria-label': 'Pick a date'});
    button.appendChild(createSVGElement('today'));
    button.addEventListener('click', () => this.#input.showPicker());
    return button;
  }

  #updateInputEmptyClass() {
    this.#node.classList.toggle('input-empty', !this.#input.value);
  }


  /**
   * @param {Date} date - The Date object that will be set as the value of the input element.
   * @throws {Error} Throws an error if the provided value is not a valid Date object.
   */
  set value(date) {
    if (!date) {
      this.#input.value = '';
    } else if (date instanceof Date && !isNaN(date)) {
      this.#input.value = date.toISOString().split('T')[0];
    } else {
      throw new Error('Invalid Date object');
    }
    this.#updateInputEmptyClass();
  }

  get value() {
    return this.#input.value;
  }

  /**
   * Returns the root node of the task date component.
   * 
   * @returns {HTMLElement} The root node containing the task date button and date input.
   */
  get node() {
    return this.#node;
  }
}

class TaskPriority {
  #node;
  #button;
  #menu;
  #menuElements
  #priority;
  #options = ['high', 'medium', 'low'];
  #menuOpen = false;

  /**
   * Creates an instance of TaskPriority.
   * Initializes the task priority component by creating the UI elements and appending them to the node.
   */
  constructor() {
    this.#node = createNode('div', {'class': 'task-priority'});
    this.#button = this.#createButton();
    this.#menu = this.#createMenu();
    this.#menuElements = Array.from(this.#menu.querySelectorAll('button'));
    this.#node.append(this.#button, this.#menu);
  }

  /**
   * Creates the button to toggle the visibility of the priority menu.
   * 
   * @returns {HTMLElement} The button element.
   */
  #createButton() {
    const button = createNode('button', {
      'aria-label': 'Show task priority options',
      'aria-controls': 'priority-menu', 
      'aria-expanded': 'false'
    });
    button.appendChild(createSVGElement('label'));
    button.addEventListener('click', () => this.#toggleMenu());
    return button;
  } 

  /**
   * Creates the menu containing priority options.
   * 
   * @returns {HTMLElement} The menu element (an unordered list).
   */
  #createMenu() {
    const list = createNode('ul', {
      id: 'priority-menu', 
      'aria-label': 'Choose task priority', 
      'aria-hidden': 'true'
    });
    
    // Create list items for each priority option
    this.#options.forEach(option => {
      const item = createNode('li');
      const button = this.#createMenuItem(option);
      item.appendChild(button);
      list.appendChild(item);
    });
    
    return list;
  }

  /**
   * Creates a button for a specific priority option.
   * 
   * @param {string} option The priority option ('high', 'medium', or 'low').
   * @returns {HTMLElement} The button element for the given option.
   */
  #createMenuItem(option) {
    const button = createNode('button', {'class': `priority-${option}`});
    button.textContent = option;
    button.setAttribute('tabindex', '-1');
    button.addEventListener('click', () => this.#handleOptionClick(button, option));

    return button;
  }

  /**
   * Handles the click event for selecting a priority.
   * 
   * @param {HTMLElement} button The button that was clicked.
   * @param {string} option The priority option ('high', 'medium', or 'low').
   */
  #handleOptionClick(button, option) {
    const isSamePriority = this.#priority === option;
    
    if (this.#priority) this.#resetButtonStyles();
    
    this.#priority = isSamePriority ? null : option;
    if(!isSamePriority) this.#setButtonActive(button);
    
    this.#toggleMenu();
    
    bus.emit('task-input-change');
  }

  /**
   * Sets the clicked priority button as active and updates its color.
   * 
   * @param {HTMLElement} button - The button to mark as active.
   */
  #setButtonActive(button) {
    button.classList.add('priority-active');
    this.#updateTogglerColor(`--clr-prio-${this.#priority}`);
  }

  /**
   * Resets the styles of the previously selected item and menu toggler button.
   */
  #resetButtonStyles() {
    this.#updateTogglerColor();

    const activeItem = this.#menuElements.find(item => item.classList.contains('priority-active'));
    if (!activeItem) return;
    activeItem.classList.remove('priority-active');
    
  }

  /**
   * Updates color of menu toggler button.
   * 
   * @param {string} [priority=this.#priority] - The priority to set the color for. 
   */
  #updateTogglerColor(color) {
    color = color || '--clr-secondary-500';
    this.#node.style.setProperty('--btn-color', `hsl(var(${color}))`);
  }

  /**
   * Toggles the visibility of the priority menu.
   */
  #toggleMenu() {
    this.#menuOpen = !this.#menuOpen;
    this.#button.setAttribute('aria-expanded', String(this.#menuOpen));
    this.#menu.setAttribute('aria-hidden', String(!this.#menuOpen));

    // Manage tabindex for keyboard navigation
    this.#menuElements.forEach(element => {
      element.setAttribute('tabindex', this.#menuOpen ? '0': '-1');
    });

    // Focus the button when the menu is closed
    if (!this.#menuOpen) this.#button.focus();
  }
  
  /**
   * Set the priority value programmatically.
   * 
   * @param {string} priority - The new priority value.
   */
  set value(priority) {
    this.#resetButtonStyles();
    if (this.#options.includes(priority)) {
      this.#priority = priority;
      const button = this.#menuElements.find(item => item.classList.contains(`priority-${priority}`));
      this.#setButtonActive(button);
    } else {
      this.#priority = null;
    }
  }

  get value() {
    return this.#priority;
  }

  /**
   * Returns the root node of the task priority component.
   * 
   * @returns {HTMLElement} The root node containing the task priority button and menu.
   */
  get node() {
    return this.#node;
  }
}

class TaskProject {
  #node
  #projects
  #selector
  #isExpanded = false;

  constructor(projects=[]) {
    this.#node = createNode('div', {
      'class': 'project-select input-empty',
      'data-state': 'closed'
    });
    
    this.#projects = projects;
    this.#selector = this.#createSelector(this.#projects);
    const button = this.#createButton();

    this.#node.append(button, this.#selector);
  }

  /**
   * Creates a dropdown selector and populates it with project options.
   * @param {Array<string>} projects - List of project names.
   * @returns {HTMLSelectElement} The populated `select` element.
   */
  #createSelector(projects) {
    const selector = createNode('select', {
      'id': 'projects-selector',
      'aria-label': 'Choose a project',
      'tabindex': '-1',
    });
    selector.addEventListener('change', () => {
      this.#node.classList.toggle('input-empty', !selector.value);
      bus.emit('task-input-change');
    });

    // Add default option and project options
    selector.appendChild(new Option('Projects', ''));
    projects.forEach(project => selector.appendChild(new Option(project, project)));

    return selector;
  }

  /**
   * Creates a button for toggling the dropdown selector visibility.
   * @returns {HTMLButtonElement} The button element.
   */
  #createButton() {
    const button = createNode('button', {
      'aria-controls': 'projects-selector',
      'aria-expanded': 'false',
      'aria-label': 'Show projects',
    });
  
    button.appendChild(createSVGElement('projects'));
    button.addEventListener('click', () => this.#handleToggle(button));

    return button;
  }

  /**
   * Toggles the visibility of the dropdown selector.
   * @param {HTMLButtonElement} button - The button that triggers the toggle.
   */
  #handleToggle(button) {
    this.#isExpanded = !this.#isExpanded;
    button. setAttribute('aria-expanded', String(this.#isExpanded));
    button. setAttribute('aria-label', this.#isExpanded ? 'Hide projects': 'Show projects');
    this.#selector.setAttribute('tabindex', this.#isExpanded ? '0': '-1');
    this.#node.dataset.state = this.#isExpanded ? 'open': 'closed';
  }

  /**
   * Set the project value programmatically.
   * 
   * @param {string} project - The new project value.
   */
  set value(project) {
    this.#selector.value = this.#projects.includes(project) ? project: '';
    this.#node.classList.toggle('input-empty', !this.#selector.value);
  }

  get value() {
    return this.#selector.value;
  }

  /**
   * Returns the root node of the task project component.
   * 
   * @returns {HTMLElement} The root node containing the task project button and selector.
   */
  get node() {
    return this.#node;
  }
}

/**
 * TaskModal class represents a modal for managing task creation and editing.
 * It renders dynamic input fields and buttons, handles input changes, and emits events for task actions.
 */
export default class TaskModal {
  #node
  #inputs
  
  /**
   * Constructor initializes the modal with a given task and renders the UI.
   * @param {Object} task - The task object containing pre-filled data (optional).
   */
  constructor(task={}) {
    this.#node = createNode('div', {'class': 'task-modal'});
    this.render(task);
  }
  
  /**
   * Creates the input elements for the modal.
   * @returns {Object} - An object containing all input elements.
   */
  #createInputs() {
    return {
      title: new ContentEditable('h2', {
        placeholder: 'Task title*', 
        'aria-requiered': 'true'
      }),
      description: new ContentEditable('p', {
        'placeholder': 'Task description'
      }),
      checkbox: new TaskCheckbox(),
      date: new TaskDate(),
      priority: new TaskPriority(),
      project: new TaskProject()
    };
  }

  /**
   * Checks if the input values have changed compared to the provided task.
   * @param {Object} task - The original task object to compare against.
   * @returns {boolean} - True if any input value has changed, otherwise false.
   */
  #inputsChanged(task) {
    for (const key in this.#inputs) {
      const inputValue = this.#inputs[key].value;
      const taskValue = task[key];
      if (!inputValue && !taskValue) continue; // Both are empty
      if (inputValue !== taskValue) return true
    }
    return false;
  }

  /**
   * Renders the modal UI with the provided task data.
   * @param {Object} task - The task data to pre-fill in the modal inputs.
   */
  render(task) {
    if (!this.#inputs) {
      // Initialize inputs if not already created
      this.#inputs = this.#createInputs();
      
      // Create task buttons container
      const taskButtons = createNode('div', {'class': 'task-buttons'});
      taskButtons.append(
        this.#inputs.checkbox.node, 
        this.#inputs.date.node, 
        this.#inputs.priority.node, 
        this.#inputs.project.node);
        
        // Create save button
        const saveBtn = createNode('button', {'class': 'save-btn hidden'});
        saveBtn.appendChild(createSVGElement('send'));
        saveBtn.addEventListener('click', () => {
          bus.emit(EVENTS.MODAL_SAVE, this.task);
          this.render({}); // Empty the modal after saving
          saveBtn.classList.add('hidden');
        });

        // Attchach event listener for input changes
        bus.clear('task-input-change');
        bus.on('task-input-change', () => {
          const isHidden = !this.#inputs.title.value || !this.#inputsChanged(task);
          saveBtn.classList.toggle('hidden', isHidden);
        });

        const buttonBar = createNode('div', {'class': 'button-bar'});
        buttonBar.append(taskButtons, saveBtn);
        
        this.#node.append(
          this.#inputs.title.node, 
          this.#inputs.description.node, 
          buttonBar);  
    }

    // Determine if the task is new and adjust UI accordingly
    const isNewTask = Object.keys(task).length === 0;
    this.#inputs.checkbox.node.classList.toggle('hidden', isNewTask);
    
    // Populate input values with task data
    for (const key in this.#inputs) 
      this.#inputs[key].value = task[key];
  }

  /**
   * Returns the current task data based on the input values.
   * @returns {Object} - The task data object.
   */  
  get task() {
    const task = {};
    for (const key in this.#inputs) {
      if (this.#inputs[key].value) 
        task[key] = this.#inputs[key].value;
    }
    return task;
  }

  /**
   * Returns the DOM node for the modal.
   * @returns {HTMLElement} - The modal's root DOM node.
   */  
  get node() {
    return this.#node;
  }
}