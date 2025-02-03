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

  constructor(task) {
    this.#node = createNode('li', {'data-task-id': task.id});
    this.#checkbox = TaskListItem.#createCheckbox();
    this.#titleNode = TaskListItem.#createTitleNode();

    this.update(task);

    this.#node.append(this.#checkbox, this.#titleNode);
  }

  static #createCheckbox() {
    return createNode('input', {
      type: 'checkbox',
      name: 'is-task-completed',
      'aria-label': 'Is task completed',
    });
  }

  static #createTitleNode() {
    return createNode('button', {
      class: 'li-task-title',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
    });
  }

  static #updateBorderColor(priority, node) {
    const color = priority ? `hsl(var(--clr-prio-${priority}))`: 'transparent';
    node.style.setProperty('--task-clr', color);
  }

  toggleCompletedState() {
    this.#node.classList.toggle('task-completed', this.#checkbox.checked);
  }

  update(task) {
    if (task.completed != null) {
      this.#checkbox.checked = task.completed;
      this.toggleCompletedState();
    }
    if (task.title != null) {
      this.#titleNode.textContent = task.title;
    }
    if ('priority' in task) {
      TaskListItem.#updateBorderColor(task.priority, this.#node);
    }
  }

  onMenuToggle() {
    let isMenuOpen = this.#titleNode.getAttribute('aria-expanded') === 'true';
    isMenuOpen = !isMenuOpen;
    
    this.#titleNode.setAttribute('aria-expanded', String(isMenuOpen));
    this.#titleNode.disabled = isMenuOpen;
    this.#checkbox.disabled = isMenuOpen;

    if (!isMenuOpen) this.#titleNode.focus();
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
  static #itemMenu = new ItemMenu();
  #node
  #tasks
  #listItems
  
  constructor(tasks=[]) {
    this.#node = createNode('ul', {class: 'tasks-list'});
    
    this.#tasks = {}, this.#listItems = {};
    tasks.forEach(task => {
      this.#tasks[task.id] = task;
      this.#listItems[task.id] = new TaskListItem(task);
    });
    TasksList.#sort(this.#tasks).forEach(task => {
      this.#node.appendChild(this.#listItems[task.id].node);
    });

    this.#node.addEventListener('click', this.#handleClickEvent);
    bus.on(EVENTS.TASK.DELETE, (id) => this.#deleteTask(id));
  }
 
  static #getOrderNumber(task) {
    const PRIORITY_ORDER = {'high': 0, 'medium': 1, 'low': 2};

    if (task.completed) return 4;
    if (task.priority in PRIORITY_ORDER) {
      return PRIORITY_ORDER[task.priority];
    }
    return 3;
  }
  
  static #sort(tasks) {
    return Object.values(tasks).sort((a, b) => {
      const priorityA = TasksList.#getOrderNumber(a);
      const priorityB = TasksList.#getOrderNumber(b);
      return priorityA - priorityB;
    });
  }
  
  static #openTaskMenu(listItem, taskID) {
    const menu = TasksList.#itemMenu;
    menu.close().then(() => {
      listItem.node.appendChild(menu.node);
      menu.open(taskID);

      listItem.onMenuToggle();

      bus.on(
        EVENTS.TASKS_LIST.MENU_CLOSE,
        () => listItem.onMenuToggle(),
        {once: true}
      );
    });
  }

  /**
   * Updates the positions of tasks in the list for smooth animations during sorting.
   * @param {HTMLElement} listNode - The list container node.
   * @param {Object<string, TaskListItem>} tasks - The tasks to update.
   */  
  #updatePositions() {
    const ul = this.#node;
    ul.style.pointerEvents = 'none';
    const items = Array.from(ul.children);
    const ulRect = ul.getBoundingClientRect();

    ul.style.height = ulRect.height + 'px';

    const topValues = items.map(item => {
      const rect = item.getBoundingClientRect();
      return rect.top - ulRect.top;
    });

    items.forEach((item, index) => {
      item.style.position = "absolute";
      item.style.top = `${topValues[index]}px`;
    });

    const sortedTasks = TasksList.#sort(this.#tasks);

    sortedTasks.forEach((task, index) => {
      const li = this.#listItems[task.id].node;
      const top = li.getBoundingClientRect().top - ulRect.top;
      li.style.transform = `translateY(${topValues[index] - top}px)`;
    });

    setTimeout(() => {
      sortedTasks.forEach(task => {
        const li = this.#listItems[task.id].node;
        ul.appendChild(li);
        li.style.transform = 'none';
        li.style.position = 'relative';
        li.style.top = '';
      });
      ul.style.height = 'auto';
      ul.style.pointerEvents = 'auto';
    }, 500);
  }
  
  #deleteTask(id) {
    if (!this.#tasks[id]) return;
    delete this.#tasks[id];
    this.#listItems[id].node.remove();
    delete this.#listItems[id];
  }

  #handleClickEvent = (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    
    const id = li.getAttribute('data-task-id');
    const task = this.#tasks[id];
    const taskLI = this.#listItems[id];

    if (e.target === taskLI.titleNode) {
      TasksList.#openTaskMenu(taskLI, id);
    } else if (e.target === taskLI.checkbox) {
      task.completed = e.target.checked;
      bus.emit(EVENTS.TASK.SAVE, {id, completed: task.completed});
    }
  }

  update(task) {
    const id = task.id;
    this.#tasks[id] = {...this.#tasks[id], ...task};
    this.#listItems[id].update(task);
    this.#updatePositions();
  }

  add(task) {
    this.#tasks[task.id] = task;
    this.#listItems[task.id] = new TaskListItem(task);
    this.#node.appendChild(this.#listItems[task.id].node);
    this.#updatePositions();
  }

  get node() {
    return this.#node;
  }
}