import './page.css';
import router from '../utils/router.js';

export default class Page {
  #node;

  constructor() {
    this.#node = document.createElement('main');
  }

  render(pageName) {
    router.loadPage(pageName)
      .then(page => this.#node.appendChild(page))
      .catch(error => console.error(error));

    return this.#node;
  }
}
