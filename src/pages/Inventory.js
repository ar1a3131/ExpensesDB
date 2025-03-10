import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DownloadCSV from './DownloadCSV';


const API_URL = process.env.REACT_APP_API_URL;

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [actionMenus, setActionMenus] = useState({}); // Track each item's action menu state separately
    const [quantityChanges, setQuantityChanges] = useState({});
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ item: '', quantity: 0 });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/inventory`);
            console.log('Inventory data:', response.data); // Log the data to see its structure
            setInventory(response.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    // Toggle only the specific item's action menu
    const toggleActionMenu = (itemName) => {
        setActionMenus(prev => ({
            ...prev,
            [itemName]: !prev[itemName]
        }));
    };

    const handleDelete = async (itemName) => {
        if (!itemName) {
            console.error('Cannot delete item: Item name is undefined');
            return;
        }
        
        try {
            // Use the item name instead of ID if ID isn't available
            await axios.delete(`${API_URL}/api/delete-item/${encodeURIComponent(itemName)}`);
            fetchInventory(); // Refresh the list
            
            // Close the action menu
            setActionMenus(prev => ({
                ...prev,
                [itemName]: false
            }));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleQuantityChange = async (itemName, currentQuantity) => {
        if (!itemName) {
            console.error('Cannot update item: Item name is undefined');
            return;
        }
        
        const change = quantityChanges[itemName] || 0;
        
        // Ensure we're working with numbers
        const newQuantity = parseInt(change); // Use the absolute value instead of adding
        
        // Validate that newQuantity is actually a number
        if (isNaN(newQuantity)) {
            console.error('Invalid quantity value');
            return;
        }
        
        try {
            // Use the item name instead of ID if ID isn't available
            await axios.put(`${API_URL}/api/update-quantity/${encodeURIComponent(itemName)}`, {
                quantity: newQuantity
            });
            fetchInventory();
            
            // Close just this item's action menu
            setActionMenus(prev => ({
                ...prev,
                [itemName]: false
            }));
            
            // Reset just this item's quantity change
            setQuantityChanges(prev => ({
                ...prev,
                [itemName]: 0
            }));
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const updateItemQuantityChange = (itemName, value) => {
        // Parse as integer, default to 0 if NaN
        const numValue = parseInt(value);
        const changeValue = isNaN(numValue) ? 0 : numValue;
        
        setQuantityChanges(prev => ({
            ...prev,
            [itemName]: changeValue
        }));
    };

    const handleAddNewItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/add-item`, {
                item: newItem.item,
                quantity: parseInt(newItem.quantity) || 0,
                date: new Date().toISOString().split('T')[0]
            });
            setShowNewItemModal(false);
            setNewItem({ item: '', quantity: 0 });
            fetchInventory();
        } catch (error) {
            console.error('Error adding new item:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Inventory</h1>
                <button 
                    onClick={() => setShowNewItemModal(true)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Add New Item
                </button>
                <DownloadCSV rows={inventory} />
            </div>
            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">Date</th>
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Quantity</th>
                        <th className="p-2 border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.length > 0 ? (
                        inventory.map((item) => (
                            <tr key={item.item}>
                                <td className="p-2 border">{new Date(item.last_update).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                                <td className="p-2 border">{item.item}</td>
                                <td className="p-2 border">{item.quantity}</td>
                                <td className="p-2 border relative">
                                    <button 
                                        onClick={() => toggleActionMenu(item.item)}
                                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                                    >
                                        Actions ▼
                                    </button>
                                    
                                    {actionMenus[item.item] && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                                            <div className="p-2 border-b">
                                                <input
                                                    type="number"
                                                    value={quantityChanges[item.item] || ''}
                                                    onChange={(e) => updateItemQuantityChange(item.item, e.target.value)}
                                                    className="w-full p-1 border rounded"
                                                    placeholder="Enter quantity"
                                                />
                                                <button 
                                                    onClick={() => handleQuantityChange(item.item, item.quantity)}
                                                    className="w-full mt-2 bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded"
                                                >
                                                    Update Quantity
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(item.item)}
                                                className="w-full text-left p-2 hover:bg-red-100 text-red-600"
                                            >
                                                Delete Item
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="p-2 text-center">No inventory data available</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showNewItemModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">Add New Item</h2>
                        <form onSubmit={handleAddNewItem}>
                            <div className="mb-4">
                                <label className="block mb-2">Item Name:</label>
                                <input
                                    type="text"
                                    value={newItem.item}
                                    onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-2">Initial Quantity:</label>
                                <input
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewItemModal(false)}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;