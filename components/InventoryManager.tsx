
import React, { useState } from 'react';
import { InventoryItem, Expense } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onAddInventory: (item: InventoryItem) => void;
  onSetRent: (rent: number) => void;
  currentRent: number;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (index: number) => void;
  currentOtherExpenses: Expense[];
  onUpdateInventoryItem: (item: InventoryItem) => void;
  onDeleteInventoryItem: (itemName: string) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  inventory, 
  onAddInventory, 
  onSetRent, 
  currentRent, 
  onAddExpense,
  onDeleteExpense,
  currentOtherExpenses,
  onUpdateInventoryItem,
  onDeleteInventoryItem,
  isFullScreen,
  onToggleFullScreen
}) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [dateAdded, setDateAdded] = useState(new Date().toISOString().split('T')[0]);
  const [rent, setRent] = useState(currentRent.toString());
  
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);


  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName && quantity && costPerUnit && dateAdded) {
      onAddInventory({
        item: itemName,
        quantity: parseInt(quantity, 10),
        costPerUnit: parseFloat(costPerUnit),
        date: new Date(dateAdded).toISOString(),
      });
      setItemName('');
      setQuantity('');
      setCostPerUnit('');
      setDateAdded(new Date().toISOString().split('T')[0]);
    }
  };

  const handleRentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSetRent(parseFloat(rent) || 0);
  };
  
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (expenseName && !isNaN(amount) && amount > 0) {
      onAddExpense({ name: expenseName, amount });
      setExpenseName('');
      setExpenseAmount('');
    }
  };
  
  const handleEditClick = (item: InventoryItem) => {
    setEditingItem({ ...item });
    setItemToDelete(null); // Ensure we're not in delete confirmation mode
  };

  const handleSaveClick = () => {
    if (editingItem) {
      // Ensure numeric fields are correctly typed before saving.
      const itemToSave: InventoryItem = {
        ...editingItem,
        quantity: parseInt(String(editingItem.quantity), 10) || 0,
        costPerUnit: parseFloat(String(editingItem.costPerUnit)) || 0,
      };
      onUpdateInventoryItem(itemToSave);
      setEditingItem(null);
      setItemToDelete(null);
    }
  };

  const handleCancelClick = () => {
    setEditingItem(null);
    setItemToDelete(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingItem) {
      const { name, value } = e.target;
      setEditingItem({
        ...editingItem,
        [name]: name === 'date' ? new Date(value).toISOString() : value,
      });
    }
  };
  
  const handleConfirmDelete = (itemName: string) => {
    onDeleteInventoryItem(itemName);
    setEditingItem(null);
    setItemToDelete(null);
  };


  return (
    <div className="space-y-6">
      {isFullScreen && (
        <div className="mb-4">
          <Button onClick={onToggleFullScreen}>← Go Back</Button>
        </div>
      )}

      {!isFullScreen && (
        <>
          <Card>
            <h2 className="text-2xl font-bold text-primary mb-4">Operational Costs</h2>
            <div className="space-y-6">
              <form onSubmit={handleRentSubmit}>
                <label htmlFor="rent" className="block text-sm font-medium text-secondary mb-1">
                  Monthly Rent
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id="rent"
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="e.g., 30000"
                  />
                  <Button type="submit">Set</Button>
                </div>
              </form>
              
              <div>
                <h3 className="text-lg font-semibold text-secondary mb-2">Other Monthly Expenses</h3>
                {currentOtherExpenses.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {currentOtherExpenses.map((expense, index) => (
                      <li key={index} className="flex justify-between items-center bg-gray-900 p-2 rounded-md">
                        <span>{expense.name}: <span className="font-semibold">₱{expense.amount.toFixed(2)}</span></span>
                        <button onClick={() => onDeleteExpense(index)} className="text-red-500 hover:text-red-400 font-bold text-lg">&times;</button>
                      </li>
                    ))}
                  </ul>
                )}
                <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
                  <Input
                    type="text"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    placeholder="Expense Name (e.g., Utilities)"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="Amount"
                      min="0"
                    />
                    <Button type="submit">Add</Button>
                  </div>
                </form>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-primary mb-4">Add New Inventory Item</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <Input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item Name (e.g., Mushroom, Olives)"
              />
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Initial Quantity"
              />
              <Input
                type="number"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="Cost Per Unit"
              />
              <div>
                <label htmlFor="dateAdded" className="block text-sm font-medium text-secondary mb-1">
                    Date Added
                </label>
                <Input
                    id="dateAdded"
                    type="date"
                    value={dateAdded}
                    onChange={(e) => setDateAdded(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">Add Item</Button>
            </form>
          </Card>
        </>
      )}
      
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-primary">Current Inventory</h2>
          {!isFullScreen && (
            <button 
              onClick={onToggleFullScreen} 
              className="text-primary hover:text-accent text-2xl transition-colors"
              aria-label="Expand Inventory View"
              title="Expand View"
            >
              ↗
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sky-900">
                <th className="p-2 font-bold text-primary">Item</th>
                <th className="p-2 text-right font-bold text-primary">Quantity</th>
                <th className="p-2 text-right font-bold text-primary">Cost/Unit</th>
                <th className="p-2 text-right font-bold text-primary">Date Added</th>
                <th className="p-2 text-center font-bold text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <tr key={item.item} className="border-b border-gray-800">
                     {editingItem?.item === item.item ? (
                       itemToDelete === item.item ? (
                        <>
                           <td className="p-2 font-medium text-red-400" colSpan={4}>Are you sure?</td>
                           <td className="p-2 text-center">
                               <div className="flex gap-2 justify-center items-center">
                                   <Button onClick={() => handleConfirmDelete(item.item)} className="bg-red-600 hover:bg-red-700 text-xs py-1 px-2">Confirm</Button>
                                   <Button onClick={() => setItemToDelete(null)} className="bg-gray-600 hover:bg-gray-700 text-xs py-1 px-2">Cancel</Button>
                               </div>
                           </td>
                        </>
                       ) : (
                        <>
                          <td className="p-2 font-medium">{item.item}</td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              name="quantity"
                              value={editingItem.quantity}
                              onChange={handleEditChange}
                              className="py-1 text-sm bg-gray-800 text-right w-20"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              type="number"
                              name="costPerUnit"
                              value={editingItem.costPerUnit}
                              onChange={handleEditChange}
                              className="py-1 text-sm bg-gray-800 text-right w-24"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              type="date"
                              name="date"
                              value={editingItem.date ? new Date(editingItem.date).toISOString().split('T')[0] : ''}
                              onChange={handleEditChange}
                              className="py-1 text-sm bg-gray-800"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex gap-3 justify-center items-center">
                              <button onClick={handleSaveClick} className="text-green-400 hover:text-green-300 text-xl font-bold">✓</button>
                              <button onClick={() => setItemToDelete(item.item)} className="text-red-500 hover:text-red-400 text-xl">🗑️</button>
                              <button onClick={handleCancelClick} className="text-red-400 hover:text-red-300 text-xl font-bold">✗</button>
                            </div>
                          </td>
                        </>
                       )
                    ) : (
                      <>
                        <td className="p-2 font-medium">{item.item}</td>
                        <td className="p-2 text-right">{item.quantity}</td>
                        <td className="p-2 text-right">₱{(parseFloat(String(item.costPerUnit)) || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">
                          {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-2 text-center">
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => handleEditClick(item)} className="text-primary hover:text-accent">✏️</button>
                            </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    No inventory items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InventoryManager;
