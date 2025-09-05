import bus, { EVENTS } from "./bus.js";

export function createHeader(content) {
  const header = document.createElement('header');
  const title  = document.createElement('h1');
  title.textContent = content;

  header.appendChild(title);
  return header;
}

export function isModalOpen() {
  const modal = document.querySelector('.modal');
  return modal.classList.contains('open');
}

export function openModal(type, data = {}) {
  bus.emit(EVENTS.MODAL.OPEN, {type, data});
  
  const caller = document.activeElement;
  const content = document.querySelector('.page-content');
  content.inert = true;

  bus.on(
    EVENTS.MODAL.CLOSE, 
    () => {
      content.inert = false;
      caller?.focus();
    },
    {clearOnReload: true, once: true}
  );
}