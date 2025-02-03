import bus, { EVENTS } from "./bus";

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
  static UPDATE_INTERVAL_IN_SEC = 30;
  #unsavedChanges = {tasks: []};
  #db
  
  constructor() {
    this.#addEventListeners();
    this.#startPerodicDatabaseUpdate();
  }

  #normalizeId(id) {
    const intId = parseInt(id, 10);
  
    if (isNaN(intId) || intId < 0) {
      throw new Error(`Invalid ID: ${id}`);
    }
    return intId;
  }
  
  #addEventListeners() {
    bus.on(EVENTS.TASK.DELETE, async (id) => {
      const task = await this.getEntity('tasks', id);
      if (task) {
        task.deleted = true;
        this.#unsavedChanges.tasks.push(task);
      }
    });

    bus.on(EVENTS.TASK.SAVE, async (taskData) => {
      if (taskData.id) {
        // If task already in DB add to changes queue
        const originalValues = await this.getEntity('tasks', taskData.id);
        delete taskData.id; // delete unnormalized id
        this.#unsavedChanges.tasks.push({...originalValues, ...taskData});
      } else {
        // For new tasks save changes immediately
        this.#save('tasks', taskData).then((result) => {
          bus.emit(EVENTS.DATABASE.TASK_ADDED, result[0]);
        });
      }
    });
  }

  #getLatestChanges(changes) {
    const latestChangesMap = new Map();
    changes.forEach(change => latestChangesMap.set(change.id, change));
    return Array.from(latestChangesMap.values());
  }

  #startPerodicDatabaseUpdate() {
    setInterval(() => {
      for (const storeName in this.#unsavedChanges) {
        const pendingChanges = this.#unsavedChanges[storeName];
        this.#unsavedChanges[storeName] = [];
        if (pendingChanges.length === 0) continue;

        const latestChanges = this.#getLatestChanges(pendingChanges);
        this.#save(storeName, latestChanges);
      }
    }, Database.UPDATE_INTERVAL_IN_SEC  * 1000);
  }

  #getObjectStore(storeName, mode) {
    const transaction = this.#db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
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
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('byPriority', 'priority', { unique: false });
          taskStore.createIndex('byDate', 'date', { unique: false });

          testTasks.forEach((task) => taskStore.put(task)); // TEST ONLY!!!
        }
      };
    });
  }

  async #save(storeName, items) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore(storeName, 'readwrite');
      const results = [];
      const errors = [];

      const itemsArray = Array.isArray(items) ? items: [items];

      for (const item of itemsArray) {
        const request = store.put(item);

        request.onsuccess = (e) => {
          const id = item.id ?? e.target.result;
          results.push({...item, id});
        };
        request.onerror = (e) => errors.push({item, error: e.target.error });
      }

      store.transaction.oncomplete = () => {
        console.log(`Saving operation for ${storeName} store completed with:`, results);
        if (errors.length > 0) {
          console.warn('Some items failed to save:', errors);
        }
        resolve(results);
      };
      store.transaction.onerror = (e) => {
        console.error(`Failed while updating ${storeName}`, e);
        reject();
      };
    });
  }

  async getEntity(storeName, id) {
    return new Promise((resolve, reject) => {
      id = this.#normalizeId(id);
      
      // Check if there are unsaved changes to the entity
      const pendingChanges = this.#getLatestChanges(this.#unsavedChanges[storeName]);
      const unsavedEntity = pendingChanges.find(entity => entity.id === id);
      if (unsavedEntity) resolve(unsavedEntity);

      const store = this.#getObjectStore(storeName, 'readonly');
      const request = store.get(id);

      request.onsuccess = (e) => {
        const task = e.target.result;
        if (task) {
          resolve(task);
        } else {
          reject(new Error(`Entity with id:${id} not found in ${storeName}`));
        }
      };

      request.onerror = (e) =>
        reject(e.target.error);
    });
  }

  async deleteEntity(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore(storeName, 'readwrite');
      const request = store.delete(this.#normalizeId(id));

      request.onsuccess = () => resolve(id);
      request.onerror = (e) =>
        reject(new Error(`Error deleting entity with id:${id} in ${storeName}`));
    });
  }

  async getTasksByDate(dateString) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore('tasks', 'readonly');
      const index = store.index('byDate');
      const range = IDBKeyRange.only(dateString);

      const request = index.getAll(range);

      request.onsuccess = (e) => {
        resolve(e.target.result.filter(task => !task.deleted));
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }
}

export default new Database();