function normalizeInputValue(value) {
  return typeof value === 'string' && value.trim() === '' ? null: value;
}

function createNode(tag, attributes={}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export {createNode, normalizeInputValue};