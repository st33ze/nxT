import './today.css';
import Button from '../components/common/button.js';
import icons from '../assets/icons.js';

export default class Today {
  #node

  constructor() {
    // Main container for the page
    this.#node = document.createElement('div');
    this.#node.classList.add('page-today');

    const header = this.#createHeader();
    const addTaskBtn = new Button('add', icons.add);

    this.#node.append(header, addTaskBtn.node);
  }
  
  #createHeader() {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'today';

    header.appendChild(title);
    return header;
  }

  /**
   * Getter for the root DOM node of the "Today" page.
   * @returns {HTMLElement} The root DOM node.
   */
  get node() {
    return this.#node;
  }
}