class EventBus {
  #listeners = new Map();
  #pageListeners = new Map();

  off(event, callback) {
    [this.#listeners, this.#pageListeners].forEach(map => {
      const eventSet = map.get(event);
      eventSet?.delete(callback);
      if (eventSet?.size === 0) {
        map.delete(event);
      }
    });
  }

  on(event, callback, options = {}) {
    const wrappedCallback = (...args) => {
      callback(...args);
      if (options.once === true) this.off(event, wrappedCallback);
    }

    const targetMap = options.clearOnReload ? this.#pageListeners: this.#listeners;

    if (!targetMap.has(event)) {
      targetMap.set(event, new Set());
    }
    targetMap.get(event).add(wrappedCallback);
  }

  emit(event, data) {
    [this.#listeners, this.#pageListeners].forEach(map => {
      const eventSet = map.get(event);
      eventSet?.forEach(callback => callback(data));
    });
  }

  clearPageListeners() {
    this.#pageListeners.clear();
  }

  logListeners() {
    console.log('App listeners:', this.#listeners);
    console.log('Temp listeners:', this.#pageListeners);
  }
}

export const EVENTS = {
  PAGE: {
    NAVIGATE: 'page:navigate',
  },
  MODAL: {
    OPEN: 'modal:open',
    CLOSE: 'modal:close',
    INPUT_CHANGE: 'modal:inputChange',
    CONTENT_CLOSE: 'modal:contentClose',
  },
  TASKS_LIST: {
    MENU_CLOSE: 'tasksList:menuClose',
    TASK_DETAILS: 'taskList:taskDetails',
  },
  TASK: {
    SAVE: 'task:save',
    DELETE: 'task:delete',
    EDIT: 'task:edit',
  },
  PROJECT: {
    CREATE: 'project:create',
    EDIT: 'project:edit',
    DELETE: 'project:delete',
  },
  PROJECT_LIST: {
    PROJECT_DETAILS: 'projectList:projectDetails',
  },
  PROJECT_MODAL: {
    PROGRESS_CHANGE: 'projectModal:progressChange',
  },
  DATABASE: {
    TASK_ADDED: 'database:taskAdded',
    PROJECT_ADDED: 'database:projectAdded',
  }
}

export default new EventBus();