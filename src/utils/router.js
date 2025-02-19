import bus, { EVENTS } from './bus.js';

export default class Router {
  #pageNames;
  #container;

  constructor(container) {
    this.#pageNames = this.#getPageNames();
    this.#container = container;

    this.#addEventListeners();
  }

  #getPageNames() {
    return require
      .context('../pages', false, /\.js$/)
      .keys()
      .map(name => name.replace('./', '').replace('.js', ''));
  }

  #addEventListeners() {
    bus.on(EVENTS.PAGE.NAVIGATE, pageName => {
      history.pushState({page: pageName}, '', '');
      this.renderPage(pageName);
    });

    window.addEventListener('popstate', (e) => {
      if (e.state?.page) {
        this.renderPage(e.state.page);
      }
    });
  }

  async #loadPage(pageName) {
    if (!this.#pageNames.includes(pageName)) {
      throw new Error('Page not found');
    }

    try {
      const module = await import(`../pages/${pageName}.js`);
      const Page = module.default;
      const page = new Page();
      return page.node;
    } catch (error) {
      throw new Error('An error occurred while loading the page:', error);
    }
  }

  renderPage(pageName) {
    bus.clearPageListeners();
    
    this.#loadPage(pageName)
      .then(page => {
        this.#container.innerHTML = '';
        this.#container.appendChild(page);
      })
      .catch(error => {
        console.error(error);
      });
  }
}