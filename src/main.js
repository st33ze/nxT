import './main.css';

import { header } from './components/header/header.js';
import Content from './components/content/content.js';

const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

app.appendChild(header);

const content = new Content();
content.render(app, 'today'); // Render starting page