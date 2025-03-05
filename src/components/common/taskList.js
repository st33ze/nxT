import './taskList.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, {EVENTS} from '../../utils/bus.js';
import * as taskUtils from '../../utils/taskUtils.js';

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
        this.#node.classList.add('open');
        this.#node.setAttribute('aria-hidden', 'false');
        this.#modalBtn.focus();
  
        const handleClickEvent = (e) => {
          const button = e.target.closest('button');
          const buttonEventMap = new Map([
            [this.#modalBtn, EVENTS.TASKS_LIST.TASK_DETAILS],
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

class TaskListItem {
  static #createCheckbox() {
    return createNode('input', {
      type: 'checkbox',
      name: 'is-task-completed',
      'aria-label': 'Is task completed',
    });
  }

  static #createTitle() {
    return createNode('button', {
      class: 'li-task-title',
      'aria-haspopup': 'true',
      'aria-expanded': 'false',
    });
  }

  static update(li, task) {
    if (task.completed != null) {
      const checkbox = li.querySelector('input[type="checkbox"]');
      checkbox.checked = task.completed;
      li.classList.toggle('task-completed', task.completed);
    }
    if (task.title != null) {
      const titleBtn = li.querySelector('.li-task-title');
      titleBtn.textContent = task.title;
    }
    li.setAttribute('data-priority', task.priority ?? '');
  }

  static create(task) {
    const li = createNode('li', {'data-task-id': task.id});

    const checkbox = TaskListItem.#createCheckbox(task.completed);
    const title = TaskListItem.#createTitle(task.title);
    li.append(checkbox, title);
    
    TaskListItem.update(li, task);

    return li;
  }

  static onMenuToggle(li) {
    const titleBtn = li.querySelector('.li-task-title');
    const checkbox = li.querySelector('input[type=checkbox]');
    let isMenuOpen = titleBtn.getAttribute('aria-expanded') === 'true';
    isMenuOpen = !isMenuOpen;

    titleBtn.setAttribute('aria-expanded', String(isMenuOpen));
    titleBtn.disabled = isMenuOpen;
    checkbox.disabled = isMenuOpen;

    if (!isMenuOpen) titleBtn.focus();
  }

  static isTitleBtn(element) {
    return element.classList.contains('li-task-title');
  }

  static isCheckbox(element) {
    return element.type === 'checkbox';
  }
}

class TaskList {
  static #itemMenu = new ItemMenu();
  #node
  #tasks

  constructor(tasks=[]) {
    this.#node = createNode('ul', {class: 'task-list'});

    this.#tasks = new Map(tasks.map(task => [task.id, task]));
    taskUtils.sortByPriority(tasks)
      .forEach(task => {
        this.#node.appendChild(TaskListItem.create(task));
      });

    this.#node.addEventListener('click', this.#handleClickEvent);
  }

  static #openTaskMenu(li, taskID) {
    const menu = TaskList.#itemMenu;
    menu.close().then(() => {
      li.appendChild(menu.node);
      menu.open(taskID);

      TaskListItem.onMenuToggle(li);

      bus.on(
        EVENTS.TASKS_LIST.MENU_CLOSE,
        () => TaskListItem.onMenuToggle(li),
        {once: true}
      );
    });
  }

  #handleClickEvent = (e) => {
    const li = e.target.closest('li');
    if (!li) return;

    const id = Number(li.getAttribute('data-task-id'));
    const task = this.#tasks.get(id);

    if(TaskListItem.isTitleBtn(e.target)) {
      TaskList.#openTaskMenu(li, id);
    } else if (TaskListItem.isCheckbox(e.target)) {
      task.completed = e.target.checked;
      bus.emit(EVENTS.TASK.SAVE, task);
      bus.emit(EVENTS.TASK.EDIT, task);
    }
  }

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

    const sortedTasks = taskUtils.sortByPriority(Array.from(this.#tasks.values()));
    const idMappedItems = new Map(
      items.map(item => [Number(item.getAttribute('data-task-id')), item])
    );
    sortedTasks.forEach((task, index) => {
      const li = idMappedItems.get(task.id);
      const top = li.getBoundingClientRect().top - ulRect.top;
      li.style.transform = `translateY(${topValues[index] - top}px)`;
    });

    setTimeout(() => {
      sortedTasks.forEach(task => {
        const li = idMappedItems.get(task.id);
        ul.appendChild(li);
        li.removeAttribute('style');
      });
      ul.removeAttribute('style');
    }, 500);
  }

  #findListItem(id) {
    return this.#node.querySelector(`:scope > [data-task-id='${id}']`);
  }

  delete(taskId) {
    if (!this.#tasks.has(taskId)) return;

    this.#tasks.delete(taskId);
    this.#findListItem(taskId).remove();
  }

  save(task) {
    if (this.#tasks.has(task.id)) {
      TaskListItem.update(this.#findListItem(task.id), task);
    } else {
      this.#node.appendChild(TaskListItem.create(task));
    }
    this.#tasks.set(task.id, task);
    this.#updatePositions();
  }

  has(id) {
    return this.#tasks.has(id);
  }

  get isEmpty() {
    return this.#tasks.size === 0;
  }

  get node() {
    return this.#node;
  }

}

class MultiTaskLists {
  #node
  #taskListMap

  constructor(tasks=[]) {
    this.#node = createNode('div', {class: 'task-lists-container'});

    this.#taskListMap = this.#generateListMap(tasks);

    this.#render();
  }

  #generateListMap(tasks) {
    const taskMapByDate = taskUtils.mapTasksByDate(tasks);

    const sortedEntries = taskUtils.sortEntriesByDate(taskMapByDate);
    
    return new Map(sortedEntries.map(([date, tasks]) => [date, new TaskList(tasks)]));
  }

  #createTaskListSection(date, listNode) {
    const section = createNode('section', {class: 'task-list-section'});

    if (date) {
      const header = createNode('h2');
      header.textContent = date;
      section.appendChild(header);
    }
    section.appendChild(listNode);
    
    return section;
  }

  #render() {
    this.#taskListMap.forEach((taskList, date) => {
      const section = this.#createTaskListSection(date, taskList.node);
      this.#node.appendChild(section);
    });
  }

  #removeList(list) {
    const date = Array.from(this.#taskListMap.entries())
      .find(([k, v]) => v === list)?.[0];
    this.#taskListMap.delete(date);
    list.node.parentElement.remove();  
  }

  #createNewList(date) {
    const taskList = new TaskList();
    
    const taskListEntries = [...this.#taskListMap];
    const insertIndex = taskUtils.getInsertIndex(taskListEntries, date);
    
    const section = this.#createTaskListSection(date, taskList.node);
    const newEntry = [date, taskList];

    if (insertIndex === 0) {
      taskListEntries.unshift(newEntry);
      this.#node.prepend(section);
    } else if (insertIndex === taskListEntries.length) {
      taskListEntries.push(newEntry);
      this.#node.appendChild(section);
    } else {
      taskListEntries.splice(insertIndex, 0, newEntry);
      const listSections = Array.from(this.#node.querySelectorAll('.task-list-section'));
      this.#node.insertBefore(section, listSections[insertIndex]);
    }

    this.#taskListMap = new Map(taskListEntries);

    return taskList;
  }

  #getListWithTaskId(id) {
    return this.#taskListMap.values()
      .find(list => list.has(id));
  }

  save(task) {
    const id = task.id;
    const date = task.date;
    const taskList = this.#getListWithTaskId(id);

    if (taskList && taskList === this.#taskListMap.get(date)) {
      taskList.save(task);
    } else {
      taskList?.delete(id);
      if (taskList?.isEmpty) this.#removeList(taskList);

      const newList = this.#taskListMap.get(date) ?? this.#createNewList(date);
      newList.save(task);
    }
  }

  deleteTask(id) {
    const taskList = this.#getListWithTaskId(id);
    taskList?.delete(id);
  }

  get node() {
    return this.#node;
  }
}

export {TaskList, MultiTaskLists};