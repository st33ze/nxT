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
  #contentContainer;

  constructor() {
    this.#node = createNode('div', {
      'class': 'modal',
      'aria-hidden': 'true',
    });
    
    this.#contentContainer = createNode('div', { class: 'modal-content'});
    this.#node.append(this.#createControlBtns(), this.#contentContainer);

    this.#addEventListeners();

    this.#loadedContent = new Map();
  }
  
  #createControlBtns() {
    const btnPanel = createNode('div', { class: 'modal-controls' });

    const backBtn = this.#createBackBtn();
    const closeBtn = this.#createCloseBtn();

    btnPanel.append(backBtn, closeBtn);

    return btnPanel;
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

  #closeContent()  {
    this.#contentContainer.lastElementChild?.remove();
  }

  #createBackBtn() {
    const btn = createNode('button', {
      class: 'back-btn',
      'aria-label': 'Go back',
    });
    btn.appendChild(createSVGElement('arrow'));

    btn.addEventListener('click', this.#closeContent.bind(this));

    return btn;
  }

  async #loadContent(name) {
    if (this.#loadedContent.has(name)) {
      return this.#loadedContent.get(name);
    }
  
    try {
      const module = await import(`./${name}.js`);
      const content = new module.default();
      await content.init();
      this.#loadedContent.set(name, content);
      return content;
    } catch (error) {
      console.error('Failed to load module content:', error);
    }
  }

  #open(content) {
    this.#node.querySelector('.modal-content')
      .appendChild(content);
  
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
      for (const content of this.#loadedContent.values()) content.reset();
    }, 500);
  }

  #isClosing() {
    return this.#node.classList.contains('closing');
  }

  #addEventListeners() {
    bus.on(EVENTS.MODAL.OPEN, async (modal) => {
      if (this.#isClosing()) return;
      const content = await this.#loadContent(modal.type);
      content.render(modal.data);
      this.#open(content.node);
    }, {clearOnReload: true});
    
    bus.on(EVENTS.MODAL.CLOSE, () => this.#close(), {clearOnReload: true});
    
    bus.on(EVENTS.MODAL.CONTENT_CLOSE, () => {
      if (this.#contentContainer.children.length > 1) {
        this.#closeContent();
      } else {
        bus.emit(EVENTS.MODAL.CLOSE);
      }
    }, {clearOnReload: true});
  }
  
  get node() {
    return this.#node;
  }
}