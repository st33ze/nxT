import './main.css';

import { header } from './components/header/header.js';
import Content from './components/content/content.js';

const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

app.appendChild(header);

const content = new Content();
const startingPage = await content.render('today');
app.appendChild(startingPage);