import './tasksList.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, {EVENTS} from '../../utils/bus.js';

/**
 * Class representing a context menu for item management, with options to open a modal or delete a task.
 */
class ItemMenu {
  #node
  #modalBtn
  #deleteBtn

  constructor() {
    this.#node = createNode('div', {
      'class': 'item-menu hidden',
      'role': 'menu',
      'aria-hidden': 'true',
    });
    this.#modalBtn = ItemMenu.#createButton('text', {'aria-label': 'Show more'});
    this.#deleteBtn = ItemMenu.#createButton('delete', {'aria-label': 'Delete task'});

    this.#node.append(this.#modalBtn, this.#deleteBtn);
  }

  /**
   * Creates a button element with an icon and specified attributes.
   * @param {string} icon - The icon name to use in the button.
   * @param {Object} attributes - Attributes to apply to the button.
   * @returns {HTMLElement} The created button element.
   */
  static #createButton(icon, attributes) {
    const button = createNode('button', {...attributes});
    button.appendChild(createSVGElement(icon));
    return button;
  }

  /**
   * Opens the item menu for a specific task.
   * @param {string} taskID - The ID of the task associated with the menu.
   */  
  open(taskID) {
    this.#node.classList.remove('hidden');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.#node.classList.add('open');
        this.#node.setAttribute('aria-hidden', 'false');
        this.#modalBtn.focus();
  
        const handleClickEvent = (e) => {
          const button = e.target.closest('button');
          const buttonEventMap = new Map([
            [this.#modalBtn, EVENTS.MODAL.OPEN],
            [this.#deleteBtn, EVENTS.TASK.DELETE]
          ]);
          const event = buttonEventMap.get(button) ?? null;
          
          this.close().then(() => {
            if (event) bus.emit(event, taskID);
          });
          
          document.removeEventListener('keydown', handleKeydownEvent);
              
        };

        const handleKeydownEvent = (e) => {
          if (e.key === 'Escape') {
            this.close();
            document.removeEventListener('click', handleClickEvent);
            document.removeEventListener('keydown', handleKeydownEvent);
          }
        };

        document.addEventListener('keydown', handleKeydownEvent);
        document.addEventListener('click', handleClickEvent, {once: true});
      });
    });
  }

  /**
   * Closes the item menu with a transition animation.
   * Ensures no duplicate closures occur during the process.
   * @returns {Promise<void>} Resolves when the menu has fully closed.
   */  
  async close() {
    const isClosing = this.#node.classList.contains('closing');
    if (isClosing || !this.isOpen) return;
    
    this.#node.classList.add('closing');
    
    await new Promise((resolve) => {
      const onTransitionEnd = (event) => {
        if (event.target === this.#node) {
          this.#node.removeEventListener('transitionend', onTransitionEnd);
          this.#node.classList.remove('closing', 'open');
          this.#node.setAttribute('aria-hidden', 'true');
          this.#node.classList.add('hidden');
          bus.emit(EVENTS.TASKS_LIST.MENU_CLOSE);
          resolve();
        }
      };
      this.#node.addEventListener('transitionend', onTransitionEnd);
    });
  }

  get isOpen() {
    return !this.#node.classList.contains('hidden');
  }

  get node () {
    return this.#node;
  }
}

/**
 * Class representing a task item in a task list.
 */
class TaskListItem {
  #node
  #checkbox
  #titleNode
  #priority

  constructor(task) {
    this.#node = createNode('li', {'data-task-id': task.id});
    this.#checkbox = TaskListItem.#createCheckbox(task.isCompleted);
    this.#titleNode = TaskListItem.#createTitleNode(task.title);
    this.#priority = task.priority;

    
    TaskListItem.#updateBorderColor(task.priority, this.#node);
    TaskListItem.#toggleCompletedState(task.isCompleted, this.#node);

    this.#node.append(this.#checkbox, this.#titleNode);
  }

  /**
   * Creates a checkbox input element for marking task completion.
   * @param {boolean} isTaskCompleted - Whether the task is completed.
   * @returns {HTMLInputElement} The created checkbox element.
   */  
  static #createCheckbox(isTaskCompleted) {
    const checkbox = createNode('input', {
      type: 'checkbox',
      name: 'is-task-completed',
      'aria-label': 'Is task completed',
    });
    checkbox.checked = isTaskCompleted ?? false;
    return checkbox;
  }

  /**
   * Creates a button element for the task title.
   * @param {string} title - The title of the task.
   * @returns {HTMLButtonElement} The created title node.
   */  
  static #createTitleNode(title) {
    const titleNode = createNode('button', {
      class: 'li-task-title',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
    });
    titleNode.textContent = title;
    return titleNode;
  }

  static #updateBorderColor(priority, node) {
    const color = priority ? `hsl(var(--clr-prio-${priority}))`: 'transparent';
    node.style.setProperty('--task-clr', color);
  }

  static #toggleCompletedState(isTaskCompleted, node) {
    node.classList.toggle('task-completed', isTaskCompleted ?? false);
  }

  onMenuToggle() {
    let isMenuOpen = this.#titleNode.getAttribute('aria-expanded') === 'true';
    isMenuOpen = !isMenuOpen;
    
    this.#titleNode.setAttribute('aria-expanded', String(isMenuOpen));
    this.#titleNode.disabled = isMenuOpen;
    this.#checkbox.disabled = isMenuOpen;

    if (!isMenuOpen) this.#titleNode.focus();
  }

  onCheckboxClick() {
    TaskListItem.#toggleCompletedState(this.#checkbox.checked, this.#node);
  }

  get id() {
    return this.#node.getAttribute('data-task-id');
  }

  get priority() {
    return this.#priority;
  }

  get isCompleted() {
    return this.#checkbox.checked;
  }

  get checkbox() {
    return this.#checkbox;
  }

  get titleNode() {
    return this.#titleNode;
  }

  get node() {
    return this.#node;
  }
}

export default class TasksList {
  #node
  #tasks = {}
  static #itemMenu = new ItemMenu();

  constructor(tasks=[]) {
    this.#node = createNode('ul', {class: 'tasks-list'});
    tasks.forEach(task => {
      this.#tasks[task.id] = new TaskListItem(task)
    });
    TasksList.#sort(this.#tasks).forEach(task => this.#node.appendChild(task.node));
    
    this.#node.addEventListener('click', this.#handleClickEvent);
    bus.on(EVENTS.TASK.DELETE, (id) => this.#deleteTask(id));
  }

  /**
   * Determines the order number of a task based on its priority and completion status.
   * @param {TaskListItem} task - The task to evaluate.
   * @returns {number} The order number for the task.
   */  
  static #getOrderNumber(task) {
    const PRIORITY_ORDER = {'high': 0, 'medium': 1, 'low': 2};

    if (task.isCompleted) return 4;
    if (task.priority in PRIORITY_ORDER) {
      return PRIORITY_ORDER[task.priority];
    }
    return 3;
  }

  /**
   * Sorts tasks based on their priority and completion status.
   * @param {Object<string, TaskListItem>} tasks - The tasks to sort.
   * @returns {Array<TaskListItem>} The sorted tasks.
   */  
  static #sort(tasks) {
    return Object.values(tasks).sort((a, b) => {
      const priorityA = TasksList.#getOrderNumber(a);
      const priorityB = TasksList.#getOrderNumber(b);
      return priorityA - priorityB;
    });
  }
  
  static #openTaskMenu(task) {
    const menu = TasksList.#itemMenu;
    menu.close().then(() => {
      task.node.appendChild(menu.node);
      menu.open(task.id);

      task.onMenuToggle();

      bus.on(
        EVENTS.TASKS_LIST.MENU_CLOSE,
        () => task.onMenuToggle(),
        {once: true}
      );
    });
  }

  /**
   * Updates the positions of tasks in the list for smooth animations during sorting.
   * @param {HTMLElement} listNode - The list container node.
   * @param {Object<string, TaskListItem>} tasks - The tasks to update.
   */  
  static #updatePositions(listNode, tasks) {
    const items = Array.from(listNode.children);
    const ulRect = listNode.getBoundingClientRect();

    listNode.style.height = ulRect.height + 'px';

    const topValues = items.map(item => {
      const rect = item.getBoundingClientRect();
      return rect.top - ulRect.top;
    });

    items.forEach((item, index) => {
      item.style.position = "absolute";
      item.style.top = `${topValues[index]}px`;
    });


    const sortedTasks = TasksList.#sort(tasks);

    sortedTasks.forEach((task, index) => {
      const top = task.node.getBoundingClientRect().top - ulRect.top;
      task.node.style.transform = `translateY(${topValues[index] - top}px)`;
    });

    setTimeout(() => {
      sortedTasks.forEach(task => {
        listNode.appendChild(task.node);
        task.node.style.transform = 'none';
        task.node.style.position = 'relative';
        task.node.style.top = '';
      });
      listNode.style.height = 'auto';
    }, 500);
  }
  
  #deleteTask(id) {
    if (!this.#tasks[id]) return;
    this.#tasks[id].node.remove();
    delete this.#tasks[id];
  }

  #handleClickEvent = (e) => {
    const taskElement = e.target.closest('li');
    if (!taskElement) return;
    
    const taskID = taskElement.getAttribute('data-task-id');
    const task = this.#tasks[taskID];

    if (e.target === task.titleNode) {
      TasksList.#openTaskMenu(task);
    } else if (e.target === task.checkbox) {
      bus.emit(
        EVENTS.TASK.SAVE,
        {
          id: task.id,
          completed: task.isCompleted,
        }
      );
      task.onCheckboxClick();
      TasksList.#updatePositions(this.#node, this.#tasks);
    }
  }

  get node() {
    return this.#node;
  }
}