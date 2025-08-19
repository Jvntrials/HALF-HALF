import React, { useState, useMemo } from 'react';
import { Purchase, Sale, InventoryItem } from '../types';
import { CONSTANT_INVENTORY } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

interface TransactionManagerProps {
  onAddPurchase: (purchase: Purchase) => void;
  onAddSale: (sale: Sale) => void;
  inventory: InventoryItem[];
}

type TransactionType = 'purchase' | 'sale';

const TransactionManager: React.FC<TransactionManagerProps> = ({ onAddPurchase, onAddSale, inventory }) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('purchase');
  
  // State for purchase tab
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; price?: number }>>({});
  
  // State for sale tab
  const [dailySaleAmount, setDailySaleAmount] = useState('');

  const purchasableItems = useMemo(() => {
    const itemsMap = new Map<string, { costPerUnit: number }>();
    
    // Add constant inventory items to the map
    CONSTANT_INVENTORY.forEach(item => {
      itemsMap.set(item.item, { costPerUnit: item.costPerUnit });
    });

    // Add/update with items from current inventory (manually added ones)
    inventory.forEach(item => {
      const cost = parseFloat(String(item.costPerUnit)) || 0;
      itemsMap.set(item.item, { 
        costPerUnit: cost, 
      });
    });

    // Convert map to array and sort alphabetically by item name
    return Array.from(itemsMap.entries())
      .map(([item, prices]) => ({ item, ...prices }))
      .sort((a, b) => a.item.localeCompare(b.item));
  }, [inventory]);

  const handleCheckboxChange = (item: string, isChecked: boolean) => {
    setSelectedItems(prev => {
      const newSelected = { ...prev };
      if (isChecked) {
        const itemInfo = purchasableItems.find(i => i.item === item);
        const price = itemInfo?.costPerUnit ?? 0;
        newSelected[item] = { quantity: 1, price };
      } else {
        delete newSelected[item];
      }
      return newSelected;
    });
  };

  const handleQuantityChange = (item: string, quantity: string) => {
    const numQuantity = parseInt(quantity, 10);
    if (numQuantity >= 1) {
      setSelectedItems(prev => ({
        ...prev,
        [item]: { ...prev[item], quantity: numQuantity },
      }));
    }
  };

  const handlePriceChange = (item: string, price: string) => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice >= 0) {
      setSelectedItems(prev => ({
        ...prev,
        [item]: { ...prev[item], quantity: prev[item]?.quantity || 1, price: numPrice },
      }));
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'purchase') {
      Object.entries(selectedItems).forEach(([itemName, data]) => {
        if (data.price !== undefined && data.price >= 0) {
          onAddPurchase({
            item: itemName,
            quantity: data.quantity,
            cost: data.quantity * data.price,
          });
        }
      });
      setSelectedItems({});
    } else { // 'sale'
      const amount = parseFloat(dailySaleAmount);
      if(!isNaN(amount) && amount > 0) {
        onAddSale({
          item: 'Daily Sale',
          quantity: 1,
          revenue: amount
        });
        setDailySaleAmount('');
      }
    }
  };

  const renderPurchaseList = () => {
    return purchasableItems.map((itemObj, index) => {
      const item = itemObj.item;
      return (
        <div key={index} className="flex items-center justify-between p-2 bg-gray-900 rounded-md gap-2">
          <div className="flex items-center gap-3 flex-grow">
            <input
              type="checkbox"
              id={`purchase-${item.replace(/\s+/g, '-')}`}
              checked={!!selectedItems[item]}
              onChange={(e) => handleCheckboxChange(item, e.target.checked)}
              className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-accent focus:ring-accent flex-shrink-0"
            />
            <label htmlFor={`purchase-${item.replace(/\s+/g, '-')}`} className="text-secondary break-words">{item}</label>
          </div>
          {selectedItems[item] && (
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    ₱
                    </span>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={selectedItems[item].price ?? ''}
                        onChange={(e) => handlePriceChange(item, e.target.value)}
                        className="w-28 text-right pl-7"
                        placeholder="Price/Unit"
                        aria-label="Price per unit"
                    />
                </div>
              <Input
                type="number"
                min="1"
                value={selectedItems[item].quantity}
                onChange={(e) => handleQuantityChange(item, e.target.value)}
                className="w-20 text-right"
                placeholder="Qty"
                aria-label="Quantity"
              />
            </div>
          )}
        </div>
      );
    });
  };
  
  const handleTabChange = (tab: TransactionType) => {
      setActiveTab(tab);
      setSelectedItems({});
      setDailySaleAmount('');
  }

  return (
    <Card>
      <div className="flex border-b border-sky-900 mb-4">
        <button
          onClick={() => handleTabChange('purchase')}
          className={`px-4 py-2 text-lg font-semibold transition-colors duration-200 ${activeTab === 'purchase' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
        >
          Add Purchase
        </button>
        <button
          onClick={() => handleTabChange('sale')}
          className={`px-4 py-2 text-lg font-semibold transition-colors duration-200 ${activeTab === 'sale' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
        >
          Add Sale
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'purchase' && (
          <>
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {purchasableItems.length > 0 ? renderPurchaseList() : <p className="text-center text-gray-400 p-4">Add items to inventory first.</p>}
            </div>
            <Button type="submit" className="w-full" disabled={Object.keys(selectedItems).length === 0}>
              Record Purchase
            </Button>
          </>
        )}
        
        {activeTab === 'sale' && (
          <>
            <div className="space-y-4 mb-4">
              <div>
                <label htmlFor="daily-sale" className="block text-sm font-medium text-secondary mb-1">
                  Total Daily Sale Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    ₱
                  </span>
                  <Input
                    id="daily-sale"
                    type="number"
                    value={dailySaleAmount}
                    onChange={(e) => setDailySaleAmount(e.target.value)}
                    placeholder="e.g., 5000"
                    className="pl-7"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!dailySaleAmount || parseFloat(dailySaleAmount) <= 0}>
              Record Daily Sale
            </Button>
          </>
        )}
      </form>
    </Card>
  );
};

export default TransactionManager;