import bus, { EVENTS } from "./bus.js";

export function createHeader(content) {
  const header = document.createElement('header');
  const title  = document.createElement('h1');
  title.textContent = content;

  header.appendChild(title);
  return header;
}

export function openModal(type, data = {}) {
  bus.emit(EVENTS.MODAL.OPEN, {type, data});
  
  const caller = document.activeElement;
  const content = document.querySelector('.page-content');
  content.setAttribute('inert', '');

  bus.on(
    EVENTS.MODAL.CLOSE, 
    () => {
      content.removeAttribute('inert');
      caller?.focus();
    },
    {clearOnReload: true, once: true}
  );
}