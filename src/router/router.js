export default class Router {
  #pages;

  constructor() {
    this.#pages = require
                    .context('../pages', false, /\.js$/)
                    .keys()
                    .map(name => name.replace(/\.\/(.+)\.js/, '$1'));
  }

  #renderError(error) {
    const container = document.createElement('div');
    container.textContent = error;

    return container;
  }

  async load(pageName) {
    if (!this.#pages.includes(pageName)) 
      return this.#renderError('Page not found');
    
    try {
      const module = await import(`../pages/${pageName}.js`);
      return module.default;
    } catch (error) {
      return this.#renderError(error);
    }
  }
}