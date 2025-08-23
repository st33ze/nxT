export function createNode(tag, attributes={}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

export function getElementId(element) {
  for (const key in element.dataset) {
    if (key.endsWith('Id')) {
      return Number(element.dataset[key]);
    }
  }
}

export function updatePositions(list, sortedIds) {
  const items = Array.from(list.children);
  const idToItem = new Map(items.map(item => [getElementId(item), item]));

  const activeElement = document.activeElement;

  // Step 1: Capture initial positions
  const firstRects = new Map();
  items.forEach(item => {
    firstRects.set(item, item.getBoundingClientRect());
  });

  // Step 2: Reorder in-place
  sortedIds.forEach((id, i) => {
    const expectedItem = idToItem.get(id);
    if (list.children[i] !== expectedItem) {
      list.insertBefore(expectedItem, list.children[i]);
    }
  });

  // Step 3: Capture new positions and animate
  const newItems = Array.from(list.children);
  newItems.forEach(item => {
    const firstRect = firstRects.get(item);
    const lastRect = item.getBoundingClientRect();

    const deltaX = firstRect.left - lastRect.left;
    const deltaY = firstRect.top - lastRect.top;

    if (deltaX !== 0 || deltaY !== 0) {
      item.style.transition = 'none';
      item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Force layout so the browser picks up the transform
      item.getBoundingClientRect();

      // Step 4: Animate back to new position
      item.style.transition = 'transform 300ms ease';
      item.style.transform = '';

      item.addEventListener('transitionend', () => {
        item.removeAttribute('style');
      }, { once: true });
    }
  });

  // Step 5: Restore focus if needed
  if (document.activeElement !== activeElement) {
    activeElement.focus();
  }
}
