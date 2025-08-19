
import React, { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { AppData, Purchase, Sale, InventoryItem, Expense } from './types';
import InventoryManager from './components/InventoryManager';
import TransactionManager from './components/TransactionManager';
import Report from './components/Report';

const App: React.FC = () => {
  const [appData, setAppData] = useLocalStorage<AppData>('appData', {
    inventory: [],
    purchases: [],
    sales: [],
    rent: 0,
    otherExpenses: [],
  });
  const [isInventoryFullScreen, setIsInventoryFullScreen] = useState(false);

  // Effect to migrate legacy `otherExpenses` (number) to the new structure (array of objects)
  useEffect(() => {
    setAppData(currentData => {
      // The `as any` is a safe type assertion for this one-time migration check.
      if (typeof (currentData as any).otherExpenses === 'number') {
        const legacyAmount = (currentData as any).otherExpenses as number;
        return {
          ...currentData,
          otherExpenses: legacyAmount > 0 
            ? [{ name: 'Legacy Other Expenses', amount: legacyAmount }] 
            : [],
        };
      }
      return currentData; // No migration needed, return data as is.
    });
  }, [setAppData]);


  const handleAddPurchase = useCallback((purchase: Purchase) => {
    setAppData(prevData => {
      const purchaseWithDate = { ...purchase, date: new Date().toISOString() };
      const newInventory = [...prevData.inventory];
      let itemInInventory = newInventory.find(invItem => invItem.item === purchase.item);
      
      if (itemInInventory) {
        // Robustly parse values to prevent data corruption from strings
        const currentQty = parseFloat(String(itemInInventory.quantity)) || 0;
        const currentCostPerUnit = parseFloat(String(itemInInventory.costPerUnit)) || 0;
        
        const totalQuantity = currentQty + purchase.quantity;
        const totalCost = (currentCostPerUnit * currentQty) + purchase.cost;
        
        itemInInventory.quantity = totalQuantity;
        // Avoid division by zero
        itemInInventory.costPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      } else {
        newInventory.push({
          item: purchase.item,
          quantity: purchase.quantity,
          costPerUnit: purchase.cost / purchase.quantity,
          date: purchaseWithDate.date,
        });
      }

      return {
        ...prevData,
        purchases: [...prevData.purchases, purchaseWithDate],
        inventory: newInventory,
      };
    });
  }, [setAppData]);

  const handleAddSale = useCallback((sale: Sale) => {
    setAppData(prevData => {
      const saleWithDate = { ...sale, date: new Date().toISOString() };
      return {
        ...prevData,
        sales: [...prevData.sales, saleWithDate],
      };
    });
  }, [setAppData]);

  const handleAddInventory = useCallback((item: InventoryItem) => {
     setAppData(prevData => {
      const existingItem = prevData.inventory.find(inv => inv.item.toLowerCase() === item.item.toLowerCase());
      if (existingItem) {
        alert('Item already exists in inventory. Use the purchase form to add quantity.');
        return prevData;
      }
      return {
        ...prevData,
        inventory: [...prevData.inventory, item],
      };
    });
  }, [setAppData]);

  const handleSetRent = useCallback((rent: number) => {
    setAppData(prevData => ({ ...prevData, rent }));
  }, [setAppData]);
  
  const handleAddExpense = useCallback((expense: Expense) => {
    setAppData(prevData => ({
      ...prevData,
      otherExpenses: [...prevData.otherExpenses, expense],
    }));
  }, [setAppData]);

  const handleDeleteExpense = useCallback((expenseIndex: number) => {
    setAppData(prevData => ({
      ...prevData,
      otherExpenses: prevData.otherExpenses.filter((_, index) => index !== expenseIndex),
    }));
  }, [setAppData]);

  const handleUpdateInventoryItem = useCallback((updatedItem: InventoryItem) => {
    setAppData(prevData => ({
      ...prevData,
      inventory: prevData.inventory.map(item =>
        item.item === updatedItem.item ? updatedItem : item
      ),
    }));
  }, [setAppData]);

  const handleDeleteInventoryItem = useCallback((itemName: string) => {
    setAppData(prevData => ({
      ...prevData,
      inventory: prevData.inventory.filter(item => item.item !== itemName),
    }));
  }, [setAppData]);

  const handleToggleInventoryFullScreen = useCallback(() => {
    setIsInventoryFullScreen(prev => !prev);
  }, []);


  return (
    <div className="min-h-screen bg-base p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-wider">
            🍕 Pizza Kiosk Analyzer
          </h1>
          <p className="text-secondary mt-2">Your offline-first inventory and cost assistant.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {!isInventoryFullScreen && (
            <div className="lg:col-span-2 space-y-6">
              <TransactionManager onAddPurchase={handleAddPurchase} onAddSale={handleAddSale} inventory={appData.inventory} />
              <Report data={appData} />
            </div>
          )}

          <div className={isInventoryFullScreen ? "lg:col-span-3" : ""}>
            <InventoryManager 
              inventory={appData.inventory} 
              onAddInventory={handleAddInventory} 
              onSetRent={handleSetRent} 
              currentRent={appData.rent}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              currentOtherExpenses={appData.otherExpenses}
              onUpdateInventoryItem={handleUpdateInventoryItem}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              isFullScreen={isInventoryFullScreen}
              onToggleFullScreen={handleToggleInventoryFullScreen}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
