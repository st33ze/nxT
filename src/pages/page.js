import './page.css';
import router from '../utils/router.js';

export default class Page {
  #node;

  constructor() {
    this.#node = document.createElement('main');
  }

  #addEventListeners() {
    // WYJEB TO W PIZDU
  }

  clear() {

  }

  render(pageName) {
    router.loadPage(pageName)
      .then(page => this.#node.appendChild(page))
      .catch(error => console.error(error));

    return this.#node;
  }
}
