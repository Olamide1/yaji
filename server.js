require('dotenv').config()
const path = require('path');

const express = require('express');
const fs = require('fs');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-08-01',
    appInfo: {
        // For sample support and debugging, not required for production:
        name: 'stripe-checkout-test-v1',
        version: '0.0.1',
        url: 'https://github.com/Olamide1/kb',
    },
})

const cors = require('cors'); // Import CORS module
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use(express.static("."));

app.post('/submit-order', (req, res) => {
    const newOrder = req.body;
    console.log("Received order:", req.body); // Log the incoming order
    fs.readFile('orders.json', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        const orders = JSON.parse(data);
        // Important: adding timestamp so we know when the order came in.
        orders.push({...newOrder, timestamp: new Date()});
        fs.writeFile('orders.json', JSON.stringify(orders), (err) => {
            if (err) {
                res.status(500).json({message: 'Issue taking your order...', err});
            } else {
                res.json({ message: 'Order saved successfully' });
            }
            
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

app.post('/add-menu-item', async (req, res) => {
    const newItem = req.body; // Your new menu item from the request
    

    /**
     * also create on stripe
     * 
     * TODO: (https://stripe.com/docs/api/products/create)
     * 1. add images
     */
    const productOnStripe = await stripe.products.create({
        name: req.body.name,
        description: req.body.description,
        metadata: {
            biz: 'yaji_lagos', // don't change this!
            product_type: 'food_menu'
        }
    });

    newItem.stripeProductId = productOnStripe.id
    
    // Read the current menu from menu.json
    fs.readFile('menu.json', (err, data) => {
        if (err) throw err;
        let menu = JSON.parse(data);
        // Add the new item with a new unique id
        newItem.id = menu.length + 1; // Simple example to generate a new ID
        menu.push(newItem);
        // Write the updated menu back to menu.json
        fs.writeFile('menu.json', JSON.stringify(menu, null, 2), 'utf-8',(err) => {
            if (err) {
                res.status(500).json({message: 'Error adding menu', err})
            } else {
                res.json({message: 'New item added successfully'});
            }
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
        fs.writeFile(menuFilePath, JSON.stringify(menuData, null, 2), 'utf-8', (err) => {
            if (err) {
                res.status(500).json({ message: 'Error saving menu data', err });
            } else {
                // Respond with a success message
                res.status(200).json({ message: 'Menu data saved successfully' });
            }
        });
        
    } catch (error) {
        console.error('Error saving menu data:', error);
        // Respond with an error message
        res.status(500).json({ error: 'Error saving menu data' });
    }
});

app.get('/menu', async (req, res) => {
    try {
        fs.readFile('menu.json', (err, data) => {
            if (err) {
                res.status(500).send('Error reading file');
            } else {
                res.json(JSON.parse(data))
            }
            
        });
        
    } catch (error) {
        console.error('Error getting menu data:', error);
        // Respond with an error message
        res.status(500).json({ error: 'Error getting menu data' });
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
                        res.status(500).json({ message: 'Error updating order status', err });
                    } else {
                        res.json(orders[orderIndex]); // Return the updated order as JSON
                    }

                    
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
        fs.writeFile('menu.json', JSON.stringify(updatedMenuData, null, 2), 'utf8', (err) => {
            if (err) {
                res.status(500).json({message: 'Error updating menu', err});
            } else {
                res.status(200).json({message: 'Menu data updated successfully'});
            }
        });

        
    } catch (error) {
        console.error('Error updating menu data:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/admin', async (req, res) => {
    const options = {
        root: __dirname
    };
    const fileName = 'admin.html'
    res.sendFile(fileName, options, function (err) {
        if (err) {
            res.json({message: 'Oops', err})
            console.error('Error sending file:', err);
        } else {
            console.log('Sent:', fileName);
        }
    })
})

app.get('/', async (req, res) => {
    const options = {
        root: __dirname
    };
    const fileName = 'index.html'
    res.sendFile(fileName, options, function (err) {
        if (err) {
            res.json({message: 'Oops', err})
            console.error('Error sending file:', err);
        } else {
            console.log('Sent:', fileName);
        }
    })
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
