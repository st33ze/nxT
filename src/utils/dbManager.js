const testTasks = [
  {
    id: 1,
    title: "Finish project report",
    description: "Complete the final detailed report for the ABC project, which includes financial data, project milestones, and lessons learned. Ensure the report is formatted properly and reviewed before submission to the management team.",
    date: "2025-01-24",
    priority: "high",
    completed: false,
  },
  {
    id: 2,
    title: "Grocery shopping",
    description: "Go to the local supermarket to buy fresh vegetables, seasonal fruits, dairy products, and other weekly essentials. Also, check for discounts on household items like cleaning supplies.",
    date: "2025-01-25",
    priority: "medium",
    completed: true,
  },
  {
    id: 3,
    title: "Call with the client",
    description: "Set up a one-hour video call with the client to discuss progress on the project milestones. Prepare a brief update presentation, including timelines, current challenges, and proposed solutions.",
    date: "2025-01-26",
    priority: "high",
    completed: false,
  },
  {
    id: 4,
    title: "Workout session",
    description: "Head to the gym for a workout focusing on strength training and cardio exercises. Include a warm-up, 30 minutes of running, and strength exercises for arms and legs. Don't forget to stretch afterward.",
    date: "2025-01-24",
    priority: "low",
    completed: false,
  },
  {
    id: 5,
    title: "Prepare presentation slides",
    description: "Design a professional and visually appealing slide deck for the team meeting scheduled for next week. Include updates on the current sprint, key challenges, and goals for the upcoming quarter.",
    date: "2025-01-28",
    priority: "medium",
    completed: false,
  }
]


class Database {
  static DB_NAME = 'nxT-task-manager';
  static DB_VERSION = 1;
  #db

  /**
   * @param {string} storeName - The name of the object store.
   * @param {string} mode - The transaction mode ('readonly', or 'readwrite').
   * @returns {IDBObjectStore} - The object store instance for the specified store name.
   */
  #getObjectStore(storeName, mode) {
    const transaction = this.#db.transaction(storeName, mode);
    return  transaction.objectStore(storeName);
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(Database.DB_NAME, Database.DB_VERSION);
      
      req.onsuccess = (e) => {
        console.log('Database initialized');
        this.#db = e.target.result;
        resolve();
      };
  
      req.onerror = (e) => {
        console.error('Database initialization failed', e.target.errorCode);
        reject(e.target.errorCode);
      };
  
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
  
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', {keyPath: 'id', autoIncrement: true});
          taskStore.createIndex('byPriority', 'priority', {unique: false});
          taskStore.createIndex('byDate', 'date', {unique: false});

          testTasks.forEach((task) => taskStore.put(task)); // TEST ONLY!!!
        }
      };
    });
  }

  async saveEntity(storeName, entity) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore(storeName, 'readwrite');
      const request = store.put(entity);
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getTasksByDate(dateString) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore('tasks', 'readonly');
      const index = store.index('byDate');
      const range = IDBKeyRange.only(dateString);
      
      const request = index.getAll(range);

      request.onsuccess = (e) => {
        resolve(e.target.result);
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }

  async getEntity(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore(storeName, 'readonly');
      const request = store.get(id);

      request.onsuccess = (e) => {
        const task = e.target.result;
        if (task) {
          resolve(task);
        } else {
          reject(new Error(`Entity with ${id} not found in ${storeName}`));
        }
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }
}

export default new Database();