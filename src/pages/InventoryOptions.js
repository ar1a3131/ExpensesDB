import React, { useState } from 'react';
import axios from 'axios';
import Dropdown from './Dropdown';

const API_URL = process.env.REACT_APP_API_URL;

const InventoryOptions = ({ inventoryItems }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [existsInInventory, setExistsInInventory] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [quantityChange, setQuantityChange] = useState('');
    const [selectedItem, setSelectedItem] = useState('');

    const handleCheckboxChange = (checked) => {
        setShowDropdown(checked);
        if (!checked) {
            // Reset all fields when the checkbox is unchecked
            setExistsInInventory('');
            setNewItemName('');
            setQuantityChange('');
            setSelectedItem('');
        }
    };



    const handleSubmit = () => {
        if (existsInInventory === 'no' && newItemName) {
            onAddToInventory({ name: newItemName, quantity: 1 });
        } else if (existsInInventory === 'yes' && selectedItem && quantityChange) {
            // Update existing item quantity
            onAddToInventory({
                name: selectedItem,
                quantity: parseInt(quantityChange, 10),
            });
        }
    };

    const onAddToInventory = ({name , quantity}) => {
        if (!name || !quantity) {
            alert("Please enter valid info.");
            return;
        }
    
        const itemData = {
            date: new Date(),
            name,
            quantity
        };
    
        axios.post(`${API_URL}/api/add-item`, itemData)
            .then(response => {
                console.log('Item added:', response.data);
                alert('Item submitted successfully!');
                setNewItemName('');
                setQuantityChange('');
            })
            .catch(error => console.error('Error:', error));
    };

    return (
        <div>
            <label>
                Add this expense to inventory?:
                <input
                    type="checkbox"
                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                />
            </label>

            {showDropdown && (
                <div>
                    <Dropdown
                        label="Does this item already exist in the inventory?"
                        options={[
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No' },
                        ]}
                        value={existsInInventory}
                        onChange={setExistsInInventory}
                        placeholder="Select an option"
                    />

                    {existsInInventory === 'no' && (
                        <div>
                            <label>
                                Item Name:
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Enter the item name"
                                />
                            </label>
                        </div>
                    )}

                    {existsInInventory === 'yes' && (
                        <div>
                            <Dropdown
                                label="Select an existing item:"
                                options={inventoryItems.map((item) => ({
                                    value: item.name,
                                    label: item.name,
                                }))}
                                value={selectedItem}
                                onChange={setSelectedItem}
                                placeholder="Choose an item"
                            />
                            <label>
                                Quantity (use a positive number to add or a negative number to subtract):
                                <input
                                    type="number"
                                    value={quantityChange}
                                    onChange={(e) => setQuantityChange(e.target.value)}
                                    placeholder="Enter quantity"
                                />
                            </label>
                        </div>
                    )}

                    <button type="button" onClick={handleSubmit}>
                        Save to Inventory
                    </button>
                </div>
            )}
        </div>
    );
};

export default InventoryOptions;
