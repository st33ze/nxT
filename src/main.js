import './main.css';

import { createNode } from './utils/domUtils.js';
import database from './utils/dbManager.js';
import Header from './components/header/header.js';
import Page from './pages/page.js';

async function startApp() {
  const app = createNode('div', {id: 'app'});
  const header = new Header();
  const page = new Page();
  const startingPage = await page.render('today');

  app.append(header.render(), startingPage);
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