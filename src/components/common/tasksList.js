import './tasksList.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, {EVENTS} from '../../utils/bus.js';

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

  static #createButton(icon, attributes) {
    const button = createNode('button', {...attributes});
    button.appendChild(createSVGElement(icon));
    return button;
  }

  open(taskID) {
    this.#node.classList.remove('hidden');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.#node.classList.add('open'); // Start the animation
        this.#node.setAttribute('aria-hidden', 'false');
        this.#modalBtn.focus();
  
        const handleClickEvent = (e) => {
          const button = e.target.closest('button');
          if (button === this.#modalBtn) {
            bus.emit(EVENTS.MODAL.OPEN, taskID);
          } else if (button === this.#deleteBtn) {
            bus.emit(EVENTS.TASK.DELETE, taskID);
          }
          this.close();

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

  async close() {
    const isClosing = this.#node.classList.contains('closing');
    if (isClosing || !this.isOpen) return;
    
    this.#node.classList.add('closing');
    
    await new Promise((resolve) => {
      const onTransitionEnd = (event) => {
        if (event.target === this.#node) { // Ensure it's the right element
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

class TaskListItem {
  #node
  #checkbox
  #titleNode
  #priority

  constructor(task) {
    this.#node = createNode('li', {'data-task-id': task.id});
    this.#checkbox = TaskListItem.#createCheckbox(task.isDone);
    this.#titleNode = TaskListItem.#createTitleNode(task.title);
    this.#priority = task.priority;

    
    TaskListItem.#updateBorderColor(task.priority, this.#node);
    TaskListItem.#toggleDoneState(task.isDone, this.#node);

    this.#node.append(this.#checkbox, this.#titleNode);
  }

  static #createCheckbox(isTaskDone) {
    const checkbox = createNode('input', {
      'type': 'checkbox',
      'name': 'is-task-done',
      'aria-label': 'Is task done',
    });
    checkbox.checked = isTaskDone ?? false;

    return checkbox;
  }

  static #createTitleNode(title) {
    const titleNode = createNode('button', {
      'class': 'li-task-title',
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

  static #toggleDoneState(isTaskDone, node) {
    node.classList.toggle('task-done', isTaskDone ?? false);
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
    TaskListItem.#toggleDoneState(this.#checkbox.checked, this.#node);
  }

  get id() {
    return this.#node.getAttribute('data-task-id');
  }

  get priority() {
    return this.#priority;
  }

  get isDone() {
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
    this.#node = createNode('ul', {'class': 'tasks-list'});
    tasks.forEach(task => this.#tasks[task.id] = new TaskListItem(task));
    TasksList.#sort(this.#tasks).forEach(task => this.#node.appendChild(task.node));
    this.#node.addEventListener('click', this.#handleClickEvent);
  }

  static #getOrderNumber(task) {
    const PRIORITY_ORDER = {'high': 0, 'medium': 1, 'low': 2};

    if (task.isDone) return 4;

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

    // listNode.offsetHeight;

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

  #handleClickEvent = async (e) => {
    const taskID = e.target.closest('li').getAttribute('data-task-id');
    const task = this.#tasks[taskID];

    if (e.target === task.titleNode) {
      await TasksList.#itemMenu.close();
      task.node.appendChild(TasksList.#itemMenu.node);
      TasksList.#itemMenu.open(task.id);

      task.onMenuToggle();

      bus.on(
        EVENTS.TASKS_LIST.MENU_CLOSE,
        () => task.onMenuToggle(),
        {once: true}
      );
    } else if (e.target === task.checkbox) {
      bus.emit(
        EVENTS.TASK.SAVE,
        {
          id: task.id,
          isDone: task.isDone,
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