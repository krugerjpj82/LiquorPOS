
import { openDB, IDBPDatabase } from 'idb';
import { InventoryItem, SaleRecord, ProcessingHistory } from '../types';

const DB_NAME = 'LiquorPOS_BOH_DB';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('inventory')) {
        db.createObjectStore('inventory', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
    },
  });
};

export const saveInventory = async (items: InventoryItem[]) => {
  const db = await initDB();
  const tx = db.transaction('inventory', 'readwrite');
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  const db = await initDB();
  return db.getAll('inventory');
};

export const saveSales = async (records: SaleRecord[]) => {
  const db = await initDB();
  const tx = db.transaction('sales', 'readwrite');
  for (const record of records) {
    await tx.store.put(record);
  }
  await tx.done;
};

export const getSales = async (): Promise<SaleRecord[]> => {
  const db = await initDB();
  return db.getAll('sales');
};

export const addHistory = async (entry: ProcessingHistory) => {
  const db = await initDB();
  await db.add('history', entry);
};

export const getHistory = async (): Promise<ProcessingHistory[]> => {
  const db = await initDB();
  return db.getAll('history');
};
