import './today.css';
import Button from '../components/common/button.js';
import { icons } from '../assets/icons.js';

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

  #createAddTaskBtn() {
    const button = new Button(icons.add, 'add-btn', 'new task');
    return button.render();
  }

  render() {
    const header = this.#createHeader();
    const addTaskBtn = this.#createAddTaskBtn();

    this.#node.append(header, addTaskBtn);

    return this.#node;
  }
}