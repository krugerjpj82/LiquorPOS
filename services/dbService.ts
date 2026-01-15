
import { AppState, Product, Sale } from '../types';

const STORAGE_KEY = 'omnipos_pro_data';

const DEFAULT_PRODUCTS: Product[] = [];

export const dbService = {
  loadData: (): AppState => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure currency is ZAR even for existing data
      parsed.config.currency = "ZAR";
      // If store name is the old default, update it
      if (parsed.config.storeName === "OmniPOS Market") {
        parsed.config.storeName = "LiquorPOS";
      }
      return parsed;
    }
    const initialState: AppState = {
      products: DEFAULT_PRODUCTS,
      sales: [],
      config: {
        storeName: "LiquorPOS",
        currency: "ZAR",
        backupEnabled: true,
        lastBackup: null
      }
    };
    dbService.saveData(initialState);
    return initialState;
  },

  saveData: (state: AppState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  exportData: (state: AppState) => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `omnipos_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    // Update last backup timestamp
    const newState = { ...state, config: { ...state.config, lastBackup: Date.now() } };
    dbService.saveData(newState);
    return newState;
  },

  importData: (file: File): Promise<AppState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // Simple validation
          if (json.products && json.sales && json.config) {
            json.config.currency = "ZAR"; // Force ZAR on import
            dbService.saveData(json);
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
