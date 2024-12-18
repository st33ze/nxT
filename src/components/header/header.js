import './header.css';
import logoImg from '../../assets/logo.png';
import Navbar from '../nav/nav.js';

const header = document.createElement('header');

function createLogo() {
  const logo = document.createElement('a');
  logo.href = '/';
  logo.classList.add('logo');

  const img = document.createElement('img');
  img.src = logoImg;
  img.alt = 'App logo';

  logo.appendChild(img);
  header.appendChild(logo);
}
createLogo();

// Create navbar
const menuItems = [
  {
    name: 'today',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="416" height="384" x="48" y="80" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" rx="48"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M128 48v32m256-32v32"/><rect width="96" height="96" x="112" y="224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" rx="13"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M464 160H48"/></svg>`
  },
  {
    name: 'inbox',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3.25 13h3.68a2 2 0 0 1 1.664.89l.812 1.22a2 2 0 0 0 1.664.89h1.86a2 2 0 0 0 1.664-.89l.812-1.22A2 2 0 0 1 17.07 13h3.68"/><path d="m5.45 4.11l-2.162 7.847A8 8 0 0 0 3 14.082V19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4.918a8 8 0 0 0-.288-2.125L18.55 4.11A2 2 0 0 0 16.76 3H7.24a2 2 0 0 0-1.79 1.11M9 9.5h6m-4.5-3h3"/></g></svg>`
  },
  {
    name: 'projects',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><path fill="currentColor" d="M184 72H40a16 16 0 0 0-16 16v112a16 16 0 0 0 16 16h144a16 16 0 0 0 16-16V88a16 16 0 0 0-16-16m0 128H40V88h144zm48-144v120a8 8 0 0 1-16 0V56H64a8 8 0 0 1 0-16h152a16 16 0 0 1 16 16"/></svg>`
  }
];
const navbar = new Navbar(menuItems);
header.appendChild(navbar.init());

export { header };