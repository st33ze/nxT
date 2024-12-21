import './header.css';
import logoSrc from '../../assets/logo.png';
import Navbar from './nav.js';

export default class Header {
  #node

  constructor() {
    this.#node = document.createElement('header');
    this.#node.classList.add('nav-header');
  }

  /**
   * Creates a logo element for the header.
   * @param {string} imgSrc - The source URL for the logo image.
   * @returns {HTMLImageElement} - The <img> element representing the logo.
   */
  #createLogo(imgSrc) {
    const logo = document.createElement('img');
    logo.classList.add('logo');
    logo.src = imgSrc;
    logo.alt = 'nxT logo';

    return logo
  }

  /**
   * Renders the header with a logo and a navigation bar.
   * @returns {HTMLElement} - The <header> element containing the logo and navbar.
   */
  render() {
    const logo = this.#createLogo(logoSrc);
    const nav = new Navbar();

    this.#node.append(logo, nav.render());
    return this.#node;
  }
}