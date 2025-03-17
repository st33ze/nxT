import './modal.css';
import { createNode } from '../../utils/domUtils.js';
import { createSVGElement } from '../../assets/icons.js';
import bus, { EVENTS } from '../../utils/bus.js';

export const MODAL_CONTENT = {
  TASK: 'taskModal',
  PROJECT: 'projectModal',
};

export default class Modal {
  #node;
  #loadedContent;

  constructor() {
    this.#node = createNode('div', {
      'class': 'modal',
      'aria-hidden': 'true',
    });
    
    this.#node.append(
      this.#createCloseBtn(),
      createNode('div', {class: 'modal-content'})
    );

    this.#addEventListeners();

    this.#loadedContent = new Map();
  }
  
  #createCloseBtn() {
    const btn = createNode('button', {
      class: 'close-btn',
      'aria-label': 'Close',
    });
    btn.appendChild(createSVGElement('close'));

    btn.addEventListener('click', () => bus.emit(EVENTS.MODAL.CLOSE));

    return btn;
  }

  async #loadContent(name) {
    if (this.#loadedContent.has(name)) {
      return this.#loadedContent.get(name);
    }
  
    try {
      const module = await import(`./${name}.js`);
      const content = new module.default();
      this.#loadedContent.set(name, content);
      return content;
    } catch (error) {
      console.error('Failed to load module content:', error);
    }
  }

  #open(content) {
      this.#node.querySelector('.modal-content')
        .appendChild(content.node);
      
      this.#node.classList.add('open');
      this.#node.setAttribute('aria-hidden', 'false');
  
      this.#node.querySelector('.close-btn').focus();
    }
  
  #close() {
    this.#node.classList.add('closing');
    this.#node.setAttribute('aria-hidden', 'true');
    
    setTimeout(() => {
      this.#node.classList.remove('open', 'closing');
      this.#node.querySelector('.modal-content').innerHTML = '';
    }, 500);
  }

  #addEventListeners() {
    bus.on(EVENTS.MODAL.OPEN, async (modal) => {
      const content = await this.#loadContent(modal.type);
      content.render(modal.data);
      this.#open(content);
    });
    bus.on(EVENTS.MODAL.CLOSE, () => this.#close(), {clearOnReload: true});
  }
  
  get node() {
    return this.#node;
  }
}