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

export function mapTasksByDate(tasks) {
  const tasksByDate = new Map();

  tasks.forEach(task => {
    if (!tasksByDate.has(task.date)) {
      tasksByDate.set(task.date, []);
    }
    tasksByDate.get(task.date).push(task);
  });

  return tasksByDate;
}

export function sortEntriesByDate(taskMap) {
  return [...taskMap]
    .sort(([dateA], [dateB]) => {
      if (dateA === null) return -1;
      if (dateB === null) return 1;
      return dateA.localeCompare(dateB);
    });
}

export function getInsertIndex(sortedEntries, newDate) {
  if (newDate === null) return 0;
  
  let left = 0, right = sortedEntries.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    const [date] = sortedEntries[mid];

    if (date === null || date < newDate) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return left;
}