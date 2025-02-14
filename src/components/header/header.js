import './header.css';
import { createNode } from '../../utils/domUtils.js';
import logoSrc from '../../assets/logo.png';
import Navbar from './nav.js';

export default class Header {
  #node

  constructor() {
    this.#node = createNode('header', {class: 'nav-header'});

    const logo = this.#createLogo(logoSrc);
    const nav = new Navbar();
    this.#node.append(logo, nav.node);
  }

  #createLogo(imgSrc) {
    return createNode('img', {
      class: 'logo', 
      src: imgSrc, 
      alt: 'nxT logo'
    });
  }

  get node() {
    return this.#node;
  }
}