
export interface InventoryItem {
  item: string;
  quantity: number;
  costPerUnit: number;
  date?: string;
}

export interface Purchase {
  item: string;
  quantity: number;
  cost: number;
  date?: string;
}

export interface Sale {
  item: string;
  quantity: number;
  revenue: number;
  date?: string;
}

export interface Expense {
  name: string;
  amount: number;
}

export interface Analysis {
  totalPurchases: number;
  totalSales: number;
  inventoryValue: number;
  rent: number;
  otherExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
}

export interface AppData {
  inventory: InventoryItem[];
  purchases: Purchase[];
  sales: Sale[];
  rent: number;
  otherExpenses: Expense[];
}
