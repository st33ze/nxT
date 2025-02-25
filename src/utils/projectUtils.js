function calcProgress(tasks) {
  const completedTasks = tasks.filter(task => task.completed).length;
  return completedTasks / tasks.length;
}

function getOrderNumber(tasks) {
  if (tasks.length === 0) {
    return -1;
  }
  return calcProgress(tasks);
}

function sortByProgress(projects) {
  return projects.sort((a, b) => getOrderNumber(a.tasks) - getOrderNumber(b.tasks));
}

export { calcProgress, sortByProgress };