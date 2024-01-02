// Fetching menu items from menu.json
function fetchMenu() {
    fetch('menu.json')
        .then(response => response.json())
        .then(menu => displayMenu(menu))
        .catch(error => console.error('Error fetching menu:', error));
}

function displayMenu(menu) {
    const menuContainer = document.getElementById('menu');
    menu.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.innerHTML = `
            <h3 class="menu-item-title">${item.name}</h3> <!-- Added a specific class -->
            <p>${item.description}</p>
            <div class="sizes">
                ${item.sizes.map(size => `
                    <label class="size-label">
                        <input type="checkbox" name="size-${item.id}" class="item-size" data-price="${size.price}" value="${size.name}">
                        ${size.name} - $${size.price}
                    </label>
                `).join('')}
            </div>
        `;
        menuContainer.appendChild(itemDiv);
    });
    // Attach event listener to menu items for selection
    document.querySelectorAll('.item-size').forEach(item => 
        item.addEventListener('change', updateTotal));
}

function updateTotal() {
    let total = 0;
    document.querySelectorAll('.item-size:checked').forEach(item => {
        total += parseFloat(item.dataset.price);
    });
    document.getElementById('total').innerText = `Total: $${total.toFixed(2)}`;
}

// Function to set the default order status to "Received"
function setDefaultOrderStatus(order) {
    order.status = 'Received';
}

// Function to generate a unique order ID (you can use a library like uuid for a more robust solution)
function generateOrderId() {
    // Generate a random alphanumeric string as the order ID
    return Math.random().toString(36).substr(2, 9);
}

// Handling form submission
document.getElementById('orderForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Constructing the order object with a unique ID
    const order = {
        id: generateOrderId(), // Generate a unique order ID
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        items: [], // This will contain the ordered items
        total: 0,
        status: 'Received' // Set the default status to 'Received'
    };

    // Collecting ordered items
    document.querySelectorAll('.item-size:checked').forEach(item => {
        const itemContainer = item.closest('.menu-item');
        const itemName = itemContainer.querySelector('.menu-item-title').innerText;
        const itemSize = item.value;
        const itemPrice = parseFloat(item.dataset.price);
        order.items.push({ name: itemName, size: itemSize, price: itemPrice });
    });

    // Calculating total
    order.total = order.items.reduce((acc, item) => acc + item.price, 0);

    // Submitting the order to the server
    fetch('http://localhost:3000/submit-order', { // Replace with your server's URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        // Show a confirmation popup
        alert('Order submitted successfully!');

        // Reset the form
        document.getElementById('orderForm').reset();

        // Reset the total display
        document.getElementById('total').innerText = 'Total: $0.00';

        // Uncheck all selected items in the menu
        document.querySelectorAll('.item-size:checked').forEach(item => {
            item.checked = false;
        });
    })
    .catch((error) => {
        console.error('Error:', error);
        // Handle errors here, e.g., show an error message
    });
});


// Initializing the menu fetch on page load
window.onload = fetchMenu;
