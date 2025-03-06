function calcProgress(completionStates) {
  const completedTasks = completionStates.filter(state => state === true).length;
  return completedTasks / completionStates.length;
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