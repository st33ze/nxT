import './main.css';

import { createNode } from './utils/domUtils.js';
import database from './utils/dbManager.js';
import Header from './components/header/header.js';
import Page from './pages/page.js';

async function startApp() {
  const app = createNode('div', {id: 'app'});
  const header = new Header();
  const main = new Page();

  app.append(header.node, main.render('today'));
  document.body.appendChild(app);
}

(async () => {
  try {
    await database.init();
    await startApp();
  } catch(error) {
    console.error('Failed to initialize the app', error);
  }
})();