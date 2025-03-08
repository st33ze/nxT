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
    projectId: 1,
  },
  {
    id: 3,
    title: "Call with the client",
    description: "Set up a one-hour video call with the client to discuss progress on the project milestones. Prepare a brief update presentation, including timelines, current challenges, and proposed solutions.",
    date: "2025-01-26",
    priority: "high",
    completed: false,
    projectId: 1,
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
    completed: true,
    projectId: 2,
  }
];

const testProjects = [
  {
    id: 1,
    title: "To ensure that the title is vertically centered and to add ellipsis",
    description: "A software development project for a client in the healthcare industry. The project involves creating a web application for managing patient records, appointments, and billing.",
  },
  {
    id: 2,
    title: "XYZ Project",
    description: "An e-commerce platform development project for a startup company. The project includes building a responsive website, integrating payment gateways, and implementing product search functionality.",
  },
  {
    id: 3,
    title: "123 Project",
    description: "A marketing campaign project for a new product launch. The project involves creating promotional materials, social media campaigns, and tracking customer engagement.",
  }
];

class Database {
  static DB_NAME = 'nxT-task-manager';
  static DB_VERSION = 1;
  static UPDATE_INTERVAL_IN_SEC = 30;
  #unsavedChanges;
  #db;
  
  constructor() {
    this.#unsavedChanges = { 
      tasks: new Map(),
      projects: new Map(),
    };

    this.#addEventListeners();
    this.#startPerodicDatabaseUpdate();
  }

  #addEventListeners() {
    bus.on(EVENTS.TASK.DELETE, async (id) => {
      const task = await this.getEntity('tasks', id);
      if (task) {
        task.deleted = true;
        this.#unsavedChanges.tasks.set(id, task);
      }
    });

    bus.on(EVENTS.TASK.SAVE, async (task) => {
      if (task.id) {
        this.#unsavedChanges.tasks.set(task.id, task);
      } else {
        this.#save('tasks', task).then((result) => {
          bus.emit(EVENTS.DATABASE.TASK_ADDED, result[0]);
        });
      }
    });
    
    bus.on(EVENTS.PAGE.NAVIGATE, () => this.savePendingChanges());
  }

  #startPerodicDatabaseUpdate() {
    setInterval(
      () => this.savePendingChanges(), 
      Database.UPDATE_INTERVAL_IN_SEC  * 1000
    );
  }

  #getObjectStore(storeName, mode) {
    const transaction = this.#db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
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

  #updateWithPendingChanges(items, storeName) {
    const pendingChanges = this.#unsavedChanges[storeName]

    pendingChanges.values().forEach(change => {
      let left = 0, right = items.length - 1;
      
      while (left <= right) {
        let mid = Math.floor((left + right) / 2);
        const id = items[mid].id;

        if (change.id < id) {
          right = mid - 1;
        } else if (change.id > id) {
          left = mid + 1;
        } else {
          items[mid] = change;
          break;
        }
      }
    });

    return items;
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
          taskStore.createIndex('byDate', 'date', { unique: false });
          taskStore.createIndex('byProjectId', 'projectId', { unique: false });

          testTasks.forEach((task) => taskStore.put(task)); // TEST ONLY!!!
        }

        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
          
          testProjects.forEach((project) => projectStore.put(project)); // TEST ONLY!!!
        }
      };
    });
  }

  async getEntity(storeName, id) {
    return new Promise((resolve, reject) => {
      const pendingChanges = this.#unsavedChanges[storeName];
      if (pendingChanges.has(id)) {
        resolve(pendingChanges.get(id));
      }

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

  async getTasksByIndex(indexName, value) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore('tasks', 'readonly');

      if (!store.indexNames.contains(indexName)) {
        reject(new Error(`Index ${indexName} not found in tasks store`));
      }
      
      const index = store.index(indexName);
      const range = IDBKeyRange.only(value);

      const request = index.getAll(range);

      request.onsuccess = (e) => {
        const updatedTasks = this.#updateWithPendingChanges(e.target.result, 'tasks');
        resolve(updatedTasks.filter(task => !task.deleted));
      };

      request.onerror = (e) => {
        reject(e.target.error);
      };
    });
  }

  async getStoreItems(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.#getObjectStore(storeName, 'readonly');
      const request = store.getAll();

      request.onsuccess = (e) => {
        const updatedItems = this.#updateWithPendingChanges(e.target.result, storeName);
        resolve(updatedItems.filter(item => !item.deleted));
      }
      request.onerror = (e) => {
        console.error(`Error while getting items from store: ${storeName}`, e.target.error);
        reject();
      }
    });
  }

  async savePendingChanges() {
    for (const storeName in this.#unsavedChanges) {
      const pendingChanges = this.#unsavedChanges[storeName];
      this.#unsavedChanges[storeName] = new Map();
      if (!pendingChanges.size) continue;

      this.#save(storeName, Array.from(pendingChanges.values()));
    }
  }
}

export default new Database();