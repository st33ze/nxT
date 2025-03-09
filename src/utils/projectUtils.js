function calcProgress(completionStates) {
  const completedTasks = completionStates.filter(state => state === true).length;
  return completedTasks / completionStates.length;
}

function getOrderNumber(progress) {
  if (progress == null) return -1;
  return progress;
}

function sortByProgress(projects) {
  return projects.sort((a, b) => {
    return getOrderNumber(a.progress) - getOrderNumber(b.progress);
  });
}

export { calcProgress, sortByProgress };