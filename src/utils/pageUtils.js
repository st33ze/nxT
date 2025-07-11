export function createHeader(content) {
  const header = document.createElement('header');
  const title  = document.createElement('h1');
  title.textContent = content;

  header.appendChild(title);
  return header;
}