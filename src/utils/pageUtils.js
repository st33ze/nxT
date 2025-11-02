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

function getFocusFallback(caller) {
  const callerClass = ['project-card', 'li-task-title']
    .find(c => caller.classList.contains(c));
  if (!callerClass) return;

  const items = Array.from(document.querySelectorAll(`.${callerClass}`));
  const index = items.indexOf(caller);
  const [next, prev] = [items[index + 1], items[index - 1]];

  return next ?? prev ?? document.querySelector('.add-btn');
}

export function openModal(type, data = {}) {
  const caller = document.activeElement;
  const focusFallback = getFocusFallback(caller);

  bus.emit(EVENTS.MODAL.OPEN, {type, data});

  const content = document.querySelector('.page-content');
  content.inert = true;

  bus.on(
    EVENTS.MODAL.CLOSE, 
    () => {
      content.inert = false;
      const target = caller?.isConnected ? caller: focusFallback;
      target?.focus();
    },
    {clearOnReload: true, once: true}
  );
}