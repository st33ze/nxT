class EventBus {
  #listeners = {}

  on(event, callback, options = {once: false}) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    
    const wrappedCallback = (...args) => {
      callback(...args);
      if (options.once) this.off(event, wrappedCallback);
    };

    this.#listeners[event].push(wrappedCallback);
  }

  off(event, listener) {
    if (!this.#listeners[event]) return;
    this.#listeners[event] = this.#listeners[event].filter((l) => l !== listener);
  }

  emit(event, data) {
    if(!this.#listeners[event]) return;
    this.#listeners[event].forEach(callback => callback(data));
  }

  clear(...events) {
    events.forEach(event => {
      if (this.#listeners[event]) this.#listeners[event] = [];
    })
  }

  get listeners() {
    return this.#listeners;
  }
}

export const EVENTS = {
  MODAL: {
    OPEN: 'modal:open',
    CLOSE: 'modal:close',
  },
  TASKS_LIST: {MENU_CLOSE: 'tasksList:menuClose'},
  TASK: {
    SAVE: 'task:save',
    DELETE: 'task:delete',
  },
  DATABASE: {
    TASK_ADDED: 'database:taskAdded',
  }
}

export default new EventBus();