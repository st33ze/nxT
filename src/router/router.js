export default class Router {
  #pages;

  constructor() {
    this.#pages = require
                    .context('../pages', false, /\.js$/)
                    .keys()
                    .map(name => name.replace(/\.\/(.+)\.js/, '$1'));
  }

  /**
   * Creates a user-friendly error container to display an error message.
   * @param {string} message - A user-friendly error message.
   * @returns {HTMLElement} A DOM element containing the error message.
   */
  #renderError(message) {
    const container = document.createElement('div');
    container.textContent = message;
    return container;
  }

  /**
   * Logs the detailed error to the console and optionally displays a user-friendly message.
   * @param {Error} error - The error object.
   * @param {string} userMessage - A simplified message to show users (optional).
   * @returns {HTMLElement|null} A DOM element with the error message, or null if not rendered.
   */
  #handleError(error, userMessage = null) {
    console.error('Error occurred', error);
    return userMessage ? this.#renderError(userMessage): null;
  }

  /**
   * Loads and renders a page dynamically.
   * @param {string} pageName - The name of the page to load.
   * @returns {Promise<HTMLElement>} A promise that resolves to the rendered page or an error container.
   */
  async load(pageName) {
    // Check if the requested page exists
    if (!this.#pages.includes(pageName)) {
      return this.#handleError(new Error('Page not found'), 'Page not found');
    }
    
    try {
      // Dynamically import the page module
      const module = await import(`../pages/${pageName}.js`);
      const Page = module.default;
      
      // Instantiate and render the page
      const page = new Page();
      return page.node;
    } catch (error) {
      return this.#handleError(error, 'An error occurred while loading the page.');
    }
  }
}