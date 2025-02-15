import './main.css';

import { createNode } from './utils/domUtils.js';
import database from './utils/dbManager.js';
import Header from './components/header/header.js';
import Router from './utils/router.js';

async function startApp() {
  const app = createNode('div', {id: 'app'});
  
  const header = new Header();
  const main = createNode('main');
  app.append(header.node, main);

  document.body.appendChild(app);
  
  const router = new Router(main);
  router.renderPage('today');
}

(async () => {
  try {
    await database.init();
    startApp();
  } catch(error) {
    console.error('Failed to initialize the app', error);
  }
})();