import './main.css';

import Header from './components/header/header.js';
import Content from './components/content/content.js';

const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

const header = new Header();
app.appendChild(header.render());

const content = new Content();
const startingPage = await content.render('today');
app.appendChild(startingPage);