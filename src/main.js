import './main.css';

import Header from './components/header/header.js';
import Page from './pages/page.js';

const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

const header = new Header();
app.appendChild(header.render());

const page = new Page();
const startingPage = await page.render('today');
app.appendChild(startingPage);