export function normalizeInputValue(value) {
  return typeof value === 'string' && value.trim() === '' ? null: value;
}

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
  list.style.pointerEvents = 'none';
  const items = Array.from(list.children);
  const lRect = list.getBoundingClientRect();

  list.style.height = lRect.height + 'px';

  const posValues = items.map(item => {
    const rect = item.getBoundingClientRect();
    return {
      top: rect.top - lRect.top,
      left: rect.left - lRect.left
    };
    
  });


  items.forEach((item, index) => {
    item.style.position = 'absolute';
    item.style.top = `${posValues[index].top}px`;
    item.style.left = `${posValues[index].left}px`;
  });

  const idMappedItems = new Map(items.map(item => {
    return [getElementId(item), item];
  }));

  sortedIds.forEach((id, index) => {
    const item = idMappedItems.get(id);
    const top = item.getBoundingClientRect().top - lRect.top;
    const translateY = `${posValues[index].top - top}px`
    const left = item.getBoundingClientRect().left - lRect.left;
    const translateX = `${posValues[index].left - left}px`;
    item.style.transform = `translate(${translateX}, ${translateY})`;
  });

  setTimeout(() => {
    sortedIds.forEach(id => {
      const item = idMappedItems.get(id);
      list.appendChild(item);
      item.removeAttribute('style');
    });
    list.removeAttribute('style');
  }, 500);
}