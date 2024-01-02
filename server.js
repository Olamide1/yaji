const express = require('express');
const fs = require('fs');
const cors = require('cors'); // Import CORS module
const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.post('/submit-order', (req, res) => {
    const newOrder = req.body;
    console.log("Received order:", req.body); // Log the incoming order
    fs.readFile('orders.json', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        const orders = JSON.parse(data);
        orders.push(newOrder);
        fs.writeFile('orders.json', JSON.stringify(orders), (err) => {
            if (err) {
                res.status(500).send('Error writing file');
                return;
            }
            res.json({ message: 'Order saved successfully' });
        });
    });
});

app.get('/get-orders', (req, res) => {
    fs.readFile('orders.json', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.post('/add-menu-item', (req, res) => {
    const newItem = req.body; // Your new menu item from the request
    // Read the current menu from menu.json
    fs.readFile('menu.json', (err, data) => {
        if (err) throw err;
        let menu = JSON.parse(data);
        // Add the new item with a new unique id
        newItem.id = menu.length + 1; // Simple example to generate a new ID
        menu.push(newItem);
        // Write the updated menu back to menu.json
        fs.writeFile('menu.json', JSON.stringify(menu, null, 2), (err) => {
            if (err) throw err;
            res.send('New item added successfully');
        });
    });
});

// Define a route to handle saving menu data
app.post('/save-menu', async (req, res) => {
    try {
        const menuData = req.body;

        // Assuming you have a menu.json file where you want to save the menu data
        const menuFilePath = 'menu.json';

        // Write the menu data to the menu.json file
        await fs.writeFile(menuFilePath, JSON.stringify(menuData, null, 2));

        // Respond with a success message
        res.status(200).json({ message: 'Menu data saved successfully' });
    } catch (error) {
        console.error('Error saving menu data:', error);
        // Respond with an error message
        res.status(500).json({ error: 'Error saving menu data' });
    }
});

// Endpoint to update order status
app.post('/update-order-status/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;

    // Read the orders data from orders.json
    fs.readFile('orders.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading orders data:', err);
            res.status(500).json({ error: 'Error reading orders data' });
            return;
        }

        try {
            let orders = JSON.parse(data); // Parse the JSON data

            // Find the order in the orders array and update its status
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].status = newStatus;

                // Write the updated orders data back to orders.json
                fs.writeFile('orders.json', JSON.stringify(orders, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error('Error updating order status:', err);
                        res.status(500).json({ error: 'Error updating order status' });
                        return;
                    }

                    res.json(orders[orderIndex]); // Return the updated order as JSON
                });
            } else {
                res.status(404).json({ error: 'Order not found' });
            }
        } catch (parseError) {
            console.error('Error parsing orders data:', parseError);
            res.status(500).json({ error: 'Error parsing orders data' });
        }
    });
});




app.post('/update-menu', async (req, res) => {
    try {
        const updatedMenuData = req.body; // Get the updated menu data from the request body

        // Read the current menu data from menu.json
        const currentMenuData = await fs.readFile('menu.json', 'utf8');
        const menu = JSON.parse(currentMenuData);

        // Replace the menu data with the updated data
        // You can add more robust logic for merging or validating the data as needed
        // For simplicity, this example replaces the entire menu data
        await fs.writeFile('menu.json', JSON.stringify(updatedMenuData, null, 2), 'utf8');

        res.status(200).send('Menu data updated successfully');
    } catch (error) {
        console.error('Error updating menu data:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
