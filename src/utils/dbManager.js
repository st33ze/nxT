import bus, { EVENTS } from "./bus";
import { promisifyRequest, transactionPromise } from "./dbUtils";

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

  init() {
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

  getEntity = (storeName, id) => this.#get(storeName, { id });

  getStoreItems = storeName => this.#get(storeName);

  getTasksByIndex = (indexName, key) => this.#get('tasks', { indexName, key });

  
  #addEventListeners() {
    bus.on(EVENTS.TASK.CREATE, async task => {
      try {
        const results = await this.#save('tasks', task);
        bus.emit(EVENTS.DATABASE.TASK_ADDED, results[0].value);
      } catch (error) {
        console.error('💥 Failed to create task: ', error);
      }
    });
    
    bus.on(EVENTS.TASK.EDIT, task => {
      this.#unsavedChanges.tasks.set(task.id, task);
    });

    bus.on(EVENTS.TASK.DELETE, id => this.#delete('tasks', id));
    
    bus.on(EVENTS.PROJECT.CREATE, async project => {
      try {
        const results = await this.#save('projects', project);
        bus.emit(EVENTS.DATABASE.PROJECT_ADDED, results[0].value);
      } catch (error) {
        console.error('💥 Failed to create project: ', error);
      }
    });

    bus.on(EVENTS.PROJECT.EDIT, project => {
      this.#unsavedChanges.projects.set(project.id, project);
    });

    bus.on(EVENTS.PROJECT.DELETE, async (id) => {
      try {
        await this.#delete('projects', id);
        const tasks = await this.getTasksByIndex('byProjectId', id);
        if (tasks.length) await this.#delete('tasks', tasks.map(task => task.id));
      } catch (error) {
        console.error(error);
      }
    });
    
    bus.on(EVENTS.PAGE.NAVIGATE, () => this.#savePendingChanges());
  }
  
  async #save(storeName, items) {
    const store = this.#getObjectStore(storeName, 'readwrite');
    items = Array.isArray(items) ? items: [items];

    const results = await Promise.all(
      items.map(async item => {
        try {
          const id = await promisifyRequest(store.put(item));
          return { ok: true, value: { ...item, id } }
        } catch(error) {
          return { ok: false, value:item, error};
        }
      })
    );

    await transactionPromise(store.transaction);

    return results;
  }
  
  #getObjectStore(storeName, mode) {
    const transaction = this.#db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async #delete(storeName, ids) {
    const store = this.#getObjectStore(storeName, 'readwrite');
    ids = Array.isArray(ids) ? ids: [ids];

    await Promise.allSettled(ids.map(id => promisifyRequest(store.delete(id))));
    await transactionPromise(store.transaction);

    console.log(`🗑️ Deleted ${ids.length} ${storeName} items`);
  }

  #startPerodicDatabaseUpdate() {
    setInterval(
      () => this.#savePendingChanges(),
      Database.UPDATE_INTERVAL_IN_SEC  * 1000
    );
  }

  async #savePendingChanges() {
    for (const [storeName, changesMap] of Object.entries(this.#unsavedChanges)) {
      if (!changesMap.size) continue;

      const changes = [...changesMap.values()];

      try {
        const results = await this.#save(storeName, changes);
        const successes = results.filter(r => r.ok);
        const failures = results.filter(r => !r.ok);

        // Keep records that failed and that were added/updated during await
        this.#unsavedChanges[storeName] = new Map([
          ...failures.map(f => [f.value.id, f.value]),
          ...changesMap.values().filter(v => !changes.includes(v))
        ]);

        console.log(`✅ ${successes.length} ${storeName} items saved`);
        if (failures.length)
          console.warn(`⚠️ ${failures.length} failed to save in ${storeName} `, failures);
      } catch(error) {
        console.error(`💥 Error saving ${storeName}:`, error);
      }
    }
  }

  async #get(storeName, {id, indexName, key} = {}) {
    const store = this.#getObjectStore(storeName, 'readonly');
    let result;

    if (id !== undefined) {
      result = await promisifyRequest(store.get(id));
    } else if (indexName !== undefined) {
      if (!store.indexNames.contains(indexName))
        throw new Error(`Index ${indexName} not found in ${storeName} store`);

      if (key === undefined)
        throw new Error(`Key must be provided when querying index ${indexName}`);

      const index = store.index(indexName);
      const range = IDBKeyRange.only(key);

      result = await promisifyRequest(index.getAll(range));
    } else {
      result = await promisifyRequest(store.getAll());
    }

    return this.#applyPendingChanges(result, this.#unsavedChanges[storeName]);
  }

  #applyPendingChanges(records, changes) {
    if (Array.isArray(records)) {
      const mappedItems = new Map(records.map(item => [item.id, item]));

      for (const change of changes.values()) {
        if (mappedItems.has(change.id))
          mappedItems.set(change.id, change);
      }

      return Array.from(mappedItems.values());
    }

    const record = records;
    return changes.get(record.id) || record;
  }

}

export default new Database();