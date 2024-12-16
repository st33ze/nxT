import './header.css';
import { nav } from './nav/nav.js';

const header = document.createElement('header');
header.appendChild(nav);

export { header };