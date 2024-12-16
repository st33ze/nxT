import './main.css';

import { header } from './components/header/header.js';

const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

app.appendChild(header);