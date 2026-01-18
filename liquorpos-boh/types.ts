
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  amount: number;
  itemsCount: number;
  type: 'retail' | 'wholesale';
}

export interface ProcessingHistory {
  id: string;
  fileName: string;
  type: 'inventory' | 'sales';
  timestamp: string;
  status: 'success' | 'error';
  recordsProcessed: number;
}
