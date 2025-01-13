import './page.css';
import Router from '../utils/router.js';

export default class Page {
  #node;
  #router

  constructor() {
    this.#node = document.createElement('main');
    this.#router = new Router();
  }

  async render(pageName) {
    const page = await this.#router.load(pageName);
    this.#node.appendChild(page);

    return this.#node;
  }
}
