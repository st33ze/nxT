class EventBus {
  #listeners = {}

  on(event, callback, options = {once: false}) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    
    const wrappedCallback = (...args) => {
      callback(...args);  // Call the original callback
      if (options.once) {
        // Remove the listener after it fires once
        this.#listeners[event] = this.#listeners[event].filter(c => c !== wrappedCallback);
      }
    };

    this.#listeners[event].push(wrappedCallback);
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
}

export default new EventBus();