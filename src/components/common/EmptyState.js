import { createNode } from "../../utils/domUtils";
import imgSrc from '../../assets/empty.webp';

export default class EmptyState {
  #node;

  constructor({ title, description }) {
    this.#node = createNode('div', {class: 'empty-state'});

    const h2 = createNode('h2');
    h2.textContent = title;
    
    const p = createNode('p');
    p.textContent = description;

    const img = createNode('img', {
      src: imgSrc,
      alt: '',
      'aria-hidden': 'true'
    });

    this.#node.append(h2, p, img);
  }

  get node() {
    return this.#node;
  }
}