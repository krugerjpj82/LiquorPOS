
import { AppState, Product, Sale } from '../types';

const DB_NAME = 'LiquorPOS_DB';
const DB_VERSION = 1;

const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  CONFIG: 'config'
};

const DEFAULT_CONFIG = {
  storeName: "LiquorPOS",
  storeAddress: "123 Business Street, Cape Town",
  tel: "021 555 1234",
  vatNumber: "4123456789",
  receiptFooter: "Thank you for your business!",
  currency: "ZAR",
  backupEnabled: true,
  lastBackup: null,
  printLogo: true,
  printVat: true,
};

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORES.PRODUCTS)) {
        database.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORES.SALES)) {
        database.createObjectStore(STORES.SALES, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORES.CONFIG)) {
        database.createObjectStore(STORES.CONFIG);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const dbService = {
  loadData: async (): Promise<AppState> => {
    const database = await initDB();
    
    const getAll = <T>(storeName: string): Promise<T[]> => {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const getConfig = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORES.CONFIG, 'readonly');
        const store = transaction.objectStore(STORES.CONFIG);
        const request = store.get('app_config');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    };

    const products = await getAll<Product>(STORES.PRODUCTS);
    const sales = await getAll<Sale>(STORES.SALES);
    let config = await getConfig();

    if (!config) {
      config = DEFAULT_CONFIG;
      await dbService.updateConfig(config);
    }

    return { products, sales, config };
  },

  saveData: async (state: AppState) => {
    const database = await initDB();
    
    const transaction = database.transaction([STORES.PRODUCTS, STORES.SALES, STORES.CONFIG], 'readwrite');
    
    // Sync products
    const productStore = transaction.objectStore(STORES.PRODUCTS);
    productStore.clear();
    state.products.forEach(p => productStore.put(p));

    // Sync sales
    const salesStore = transaction.objectStore(STORES.SALES);
    salesStore.clear();
    state.sales.forEach(s => salesStore.put(s));

    // Sync config
    const configStore = transaction.objectStore(STORES.CONFIG);
    configStore.put(state.config, 'app_config');

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  },

  updateConfig: async (config: AppState['config']) => {
    const database = await initDB();
    const transaction = database.transaction(STORES.CONFIG, 'readwrite');
    const store = transaction.objectStore(STORES.CONFIG);
    store.put(config, 'app_config');
  },

  exportData: (state: AppState) => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `liquorpos_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    const newState = { ...state, config: { ...state.config, lastBackup: Date.now() } };
    dbService.updateConfig(newState.config);
    return newState;
  },

  importData: async (file: File): Promise<AppState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (json.products && json.sales && json.config) {
            json.config.currency = "ZAR";
            await dbService.saveData(json);
            resolve(json);
          } else {
            reject(new Error("Invalid backup format"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsText(file);
    });
  }
};
