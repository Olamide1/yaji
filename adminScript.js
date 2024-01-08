const _BASE_URL =
window.location.protocol === "https:"
    ? "https://sth-here-3c1f4d8efc12.herokuapp.com"
    : "http://localhost:3000";


// Function to fetch and display orders
function fetchOrders() {
    fetch(`${_BASE_URL}/get-orders`)
    .then(response => response.json())
    .then(orders => {
        displayOrders(orders)

        displayMetrics(); // todo: move this some where else.
    })
    .catch(error => console.error('Error fetching orders:', error));
}

// Function to display metrics
function displayMetrics() {
    fetch(`${_BASE_URL}/get-order-metrics`)
    .then(response => response.json())
    .then(order_stat => {
        console.log('order_stat', order_stat)

        const metricsContainer = document.getElementById('metrics');
        
        let _content = '<h2 class="title is-4">Order Metrics</h2>'

        if (order_stat?.length === 0) {
            _content += 'No metrics yet.'
        } else {
            order_stat.forEach((_stat) => {
                _content += `
                    <p><strong>${_stat.status}</strong> ${_stat.count}</p>
                `;
            })
        }

        metricsContainer.innerHTML = _content
    })
    .catch(error => console.error('Error fetching order stat:', error));
    

}


// Function to display orders
function displayOrders(orders) {
    const ordersContainer = document.getElementById('orders');
    ordersContainer.innerHTML = ''; // Clear out any existing content

    /**
     * TODO: sort orders in BE by created_at
     */

    if (orders?.length === 0) {
        ordersContainer.innerHTML = 'No orders'
    } else {
        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order box'; // 'box' is a Bulma class for a card-like container
            orderDiv.innerHTML = `
                <h3 class="title is-4">Order by ${order.customer.name}</h3>
                <p><strong>Email:</strong> ${order.customer.email}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Address:</strong> ${order.addresses?.[0]?.full_address}</p>
                <p><strong>Items:</strong></p>
    
                <ul>
                    ${order?.orderitems?.map((item, i) => `
                        <li>${item.submenus[0].menu.name} (${item.submenus[0].name}) - $${item.submenus[0].price.toFixed(2)} - (quantity: ${item.quantity})</li>
                    `).join('')}
                </ul>
                <p><strong>Total:</strong> $${order?.total?.toFixed(2)}</p>
                <div class="field">
                    <label class="label">Status</label>
                    <div class="control">
                        <div class="select is-fullwidth">
                            <select class="status-selector" data-order-id="${order.id}">
                                <option value="received" ${order.status === 'received' ? 'selected' : ''}>Received</option>
                                <option value="in_progress" ${order.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="sent" ${order.status === 'sent' ? 'selected' : ''}>Sent</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="failed" ${order.status === 'failed' ? 'selected' : ''}>Sent</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
            ordersContainer.appendChild(orderDiv);
    
            const statusSelector = orderDiv.querySelector('.status-selector');
            statusSelector.addEventListener('change', () => {
                const newStatus = statusSelector.value;
                const orderId = statusSelector.getAttribute('data-order-id');
    
                // Send a request to update the order status
                updateOrderStatus(orderId, newStatus, orders);
            });
        });
    }

}


function updateOrderStatus(orderId, newStatus, orders) {
    // Send a request to the server to update the order status
    fetch(`${_BASE_URL}/update-order-status/${orderId}`, {
        method: 'POST', // Use POST instead of PUT
        body: JSON.stringify({ status: newStatus }),
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(() => {
        // update statuses of the total deliveries.
        displayMetrics()
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle errors here (e.g., show an error message)
    });
}







document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();

    // Add event listener to add size button
    document.getElementById('addSize').addEventListener('click', addSizePriceInput);
    
    // Handle menu form submission
    document.getElementById('menuForm').addEventListener('submit', handleMenuFormSubmit);
});

// Function to dynamically add size-price input fields
function addSizePriceInput() {
    const container = document.getElementById('sizePriceContainer');
    const sizePriceGroup = document.createElement('div');
    sizePriceGroup.className = 'size-price-group';
    sizePriceGroup.innerHTML = `
        <input class="input size-input" type="text" placeholder="Size" required />
        <input class="input price-input" type="number" placeholder="Price" step="0.01" required />
        <button type="button" class="delete-size button is-small is-danger">Remove</button>
    `;
    container.appendChild(sizePriceGroup);

    // Handle removal of size-price group
    sizePriceGroup.querySelector('.delete-size').addEventListener('click', function() {
        sizePriceGroup.remove();
    });

    // TODO: we need to also be able to edit previous menus. and submenus.
}


// Function to handle menu form submission
function handleMenuFormSubmit(event) {
    event.preventDefault();
    const itemName = document.getElementById('itemName').value;
    const itemDescription = document.getElementById('itemDescription').value;
    const sizes = Array.from(document.querySelectorAll('.size-price-group')).map(group => {
        return {
            name: group.querySelector('.size-input').value,
            price: parseFloat(group.querySelector('.price-input').value)
        };
    });

    const newItemId = generateUniqueId();

    const newItem = {
        // id: newItemId, // Include the "id" field // not using it for now.
        name: itemName,
        description: itemDescription,
        sizes: sizes
    };

    // Send the newItem as JSON data in the request body
    fetch(`${_BASE_URL}/add-menu-item`, { 
        method: 'POST', 
        body: JSON.stringify(newItem), // Ensure newItem is properly formatted JSON
        headers: {
            'Content-Type': 'application/json' // Set the content type
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server response was not ok');
        }
        return response.text();
    })
    .then(data => {
        // Handle success here (e.g., show a popup)
        alert('New item added successfully');
        // Reset the form
        document.getElementById('menuForm').reset();

        // populate menu list with new item.
        populateMenuList()
    })
    .catch((error) => {
        console.error('Error:', error);
        // Handle errors here (e.g., show an error message)
    });
}

// Function to generate a unique ID (you can use a library like uuid for a more robust solution)
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9); // Generate a random alphanumeric string
}



// Function to handle status change
function handleStatusChange(event) {
    const orderId = event.target.getAttribute('data-order-id');
    const newStatus = event.target.value;

    // TODO: Implement the logic to send the updated status to the server
    // This typically involves a fetch request with method 'POST' or 'PUT'
    console.log(`Order ID ${orderId} status updated to ${newStatus}`);
}

// Initialize the fetch orders function
document.addEventListener('DOMContentLoaded', (event) => {
    fetchOrders();
});

// Function to show a specific section and hide others
function showSection(sectionId) {
    const sections = ['metrics', 'orders', 'menuManagement', 'menuList'];
    
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (section === sectionId) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });
}

// Show the default section when the page loads
document.addEventListener('DOMContentLoaded', () => {
    showSection('metrics'); // You can change the default section here
});


// Function to populate the menu list
async function populateMenuList() {
    const menuList = document.getElementById('menuList');

    try {
        const menu = await fetchMenuData(); // Fetch menu data from menu.json
        // Clear existing list items
        menuList.innerHTML = '';
        
        menu.forEach(item => {
            const listItem = document.createElement('li');
            const priceText = item.price ? `$${item.price.toFixed(2)}` : ''; // Check for the existence of the price property
            listItem.innerHTML = `
                ${item.name} ${priceText}
                -
                <button class="button is-small" onclick="toggleOutOfStock(${item.id}, ${!item.out_of_stock})">
                    ${item.out_of_stock ? 'Mark as In Stock' : 'Mark as Out of Stock'}
                </button>
            `;

            menuList.appendChild(listItem);

            // TODO: show the list of submenus.
        });
    } catch (error) {
        console.error('Error populating menu list:', error);
    }
}

// Function to fetch menu data from menu.json
async function fetchMenuData() {
    try {
        const response = await fetch(`${_BASE_URL}/menu`, { 
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json' // Set the content type
            }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch menu data');
        }
        const menuData = await response.json();
        return menuData;
    } catch (error) {
        console.error('Error fetching menu data:', error);
        return []; // Return an empty array in case of an error
    }
}

// Function to save menu data
async function saveMenuData(menuData) {
    /**
     * TODO: this should be written as a promise, it's been called like one.
     * 
     * Also, should it return data?
     */
    try {
        const response = await fetch(`${_BASE_URL}/save-menu`, { 
            method: 'POST', 
            body: JSON.stringify(menuData), // Ensure menuData is properly formatted JSON
            headers: {
                'Content-Type': 'application/json' // Set the content type
            }
        });
        if (!response.ok) {
            throw new Error('Failed to save menu data');
        }
        // Do we need to return??
        // const updateMenuData = await response.json();
        // return updateMenuData;
    } catch (error) {
        console.error('Error saving menu data:', error);
    }
}



// Function to toggle "Out of Stock" status
async function toggleOutOfStock(itemId, new_out_of_stock_status) {
    console.log('calling toggleOutOfStock', itemId)

    try {
        const response = await fetch(`${_BASE_URL}/update-menu-out-of-stock`, { 
            method: 'POST', 
            body: JSON.stringify({ menu_id: itemId, out_of_stock: new_out_of_stock_status }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to update menu data');
        }
        console.log('res', response)

        populateMenuList() // update the menu. We need to start using loaders.
    } catch (error) {
        console.error('Error fetching menu data:', error);
    }
    
    // Fetch the menu data from menu.json
    // let menu = await fetchMenuData()
    // const itemIndex = menu.findIndex((item) => item.id === itemId);

    // if (itemIndex > -1) {
    //     let item = menu[itemIndex]
    //     console.log('found item', item)
        
    //     item.outOfStock = !item.outOfStock; // Toggle the status
    //     // Save the updated menu data to menu.json

    //     // TODO: replace properly here.
    //     menu[itemIndex] = item // DONE: replaced here.
    //     saveMenuData(menu)

    //     // Update the menu list display
    //     populateMenuList()

    // } else {
    //     console.error('did not find item with id', itemId)
    // }

}


// Initialize the menu list
document.addEventListener('DOMContentLoaded', async () => {
    await populateMenuList(); // Populate the menu list with data
});
