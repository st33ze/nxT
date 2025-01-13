class EventBus {
  #listeners = {}

  on(event, callback) {
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(callback);
  }

  emit(event, data) {
    if(!this.#listeners[event]) return;
    this.#listeners[event].forEach(callback => callback(data));
  }

  clear(...events) {
    events.forEach(event => {
      if (this.#listeners[event]) this.#listeners[event] = []
    })
  }
}

export const EVENTS = {
  MODAL_CLOSE: 'modal:close',
  MODAL_SAVE: 'modal:save',
}

export default new EventBus();