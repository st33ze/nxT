import './today.css';
import Button from '../components/common/button.js';

export default class Today {
  #node

  constructor() {
    // Main container for the page
    this.#node = document.createElement('div');
    this.#node.classList.add('page-today');
  }

  #createHeader() {
    const header = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = 'today';

    header.appendChild(title);
    return header;
  }

  render() {
    const header = this.#createHeader();
    const addTaskBtn = new Button('new task');

    this.#node.append(header, addTaskBtn.render());

    return this.#node;
  }
}