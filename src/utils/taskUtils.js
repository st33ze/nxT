function getOrderNumber(task) {
  const PRIORITY_ORDER = {'high': 0, 'medium': 1, 'low': 2};

  if (task.completed) return 4;
  if (task.priority in PRIORITY_ORDER) {
    return PRIORITY_ORDER[task.priority];
  }
  return 3;
}

export function sortByPriority(tasks) {
  return tasks.sort((a, b) => {
    const priorityA = getOrderNumber(a);
    const priorityB = getOrderNumber(b);
    return priorityA - priorityB;
  });
}