import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [showActionMenu, setShowActionMenu] = useState(null);
    const [quantityChange, setQuantityChange] = useState(0);
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ item: '', quantity: 0 });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/inventory`);
            setInventory(response.data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    useEffect(() => {
        const fetchInventory = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/inventory`);
                setInventory(response.data);
            } catch (error) {
                console.error('Error fetching inventory:', error);
            }
        };
        fetchInventory();
    }, []);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/delete-item/${id}`);
            fetchInventory(); // Refresh the list
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleQuantityChange = async (id, change) => {
        try {
            await axios.put(`${API_URL}/api/update-quantity/${id}`, {
                quantity: change
            });
            fetchInventory();
            setShowActionMenu(null);
            setQuantityChange(0);
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const handleAddNewItem = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/add-item`, {
                item: newItem.item,
                quantity: parseInt(newItem.quantity),
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
                                <td className="p-2 border">{item.date}</td>
                                <td className="p-2 border">{item.item}</td>
                                <td className="p-2 border">{item.quantity}</td>
                                <td className="p-2 border relative">
                                    <button 
                                        onClick={() => setShowActionMenu(item.id === showActionMenu ? null : item.id)}
                                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                                    >
                                        Actions ▼
                                    </button>
                                    
                                    {showActionMenu === item.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                                            <div className="p-2 border-b">
                                                <input
                                                    type="number"
                                                    value={quantityChange}
                                                    onChange={(e) => setQuantityChange(parseInt(e.target.value))}
                                                    className="w-full p-1 border rounded"
                                                    placeholder="Enter quantity"
                                                />
                                                <button 
                                                    onClick={() => handleQuantityChange(item.id, item.quantity + quantityChange)}
                                                    className="w-full mt-2 bg-green-500 hover:bg-green-700 text-white py-1 px-2 rounded"
                                                >
                                                    Update Quantity
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
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

