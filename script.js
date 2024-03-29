const _BASE_URL =
window.location.protocol === "https:"
    ? "https://sth-here-3c1f4d8efc12.herokuapp.com"
    : "http://localhost:3000";

// Fetching menu items from menu.json
function fetchMenu() {
    
    
    fetch(`${_BASE_URL}/menu`)
        .then(response => response.json())
        .then(menu => displayMenu(menu))
        .catch(error => console.error('Error fetching menu:', error));
}

async function displayMenu(menu) {
    

    const newMenuContainer = document.getElementById('new-menu');

    menu.forEach((item) => {
        const itemDiv = document.createElement('div');
        const isOutOfStock = item?.out_of_stock ? 'disabled' : ''
        itemDiv.className = 'column is-one-third';
        itemDiv.innerHTML = `
                <div class="card">

                    <div class="card-content has-background-white">

                    <div class="media">

                    <div class="media-content">
                            <p class="title has-text-left is-4 has-text-grey-dark">
                                ${item.name} ${item?.out_of_stock ? '<span class="tag is-danger is-normal">Out of stock</span>' : ''}
                            </p>
                            <p class="subtitle is-6 has-text-grey">
                                ${item.description}
                            </p>
                        </div>
                    </div>

                        <div class="content has-text-grey is-flex is-flex-direction-column" style="gap: 15px">
                    
        
                            ${item?.submenus.map((size) =>
                                `
                                <div class="is-flex is-flex-direction-row is-justify-content-space-between is-align-items-center" style="gap: 10px">
                                <div class="is-flex-grow-1">
                                    <p class="">${size.name} - $${size.price}</p>
                                </div>
                                <div class="">
                                    <div class="is-flex is-flex-direction-row">
                                        <button
                                        title="+, more"
                                        ${isOutOfStock}
                                        onclick="updateValue(${size.stripe_product_price_id}, 'decrement')" 
                                        type="button"
                                        class="button is-link mt-0 ">
                                            <span class="icon is-small">
                                                <i class="fa-solid fa-minus"></i>
                                            </span>
                                        </button>

                                        <input 
                                        step="1"
                                        style="width: 50px"
                                        ${isOutOfStock}
                                        name="${size?.stripe_product_price_id}" 
                                        id="${size?.stripe_product_price_id}"
                                        data-price="${size?.price}"
                                        placeholder="0"
                                        min="0"
                                        class="input is-radiusless mb-0  quantity-input middle-input" 
                                        type="number" value="0" readonly>
                                        
                                        <button 
                                        ${isOutOfStock}
                                        onclick="updateValue(${size.stripe_product_price_id}, 'increment')"
                                        type="button"
                                        class="button is-danger mt-0 ">
                                            <span class="icon is-small">
                                                <i class="fa-solid fa-plus"></i>
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                                `
                            ).join('')}

                    
                        </div>
                    </div>
                </div>
            `
        newMenuContainer.appendChild(itemDiv);
    })
    


    const plusSvg = `<svg width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>plus</title><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>`
    const minusSvg = `<svg width="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>minus</title><path d="M19,13H5V11H19V13Z" /></svg>`
    const menuContainer = document.getElementById('menu-not-use');
    menu.forEach(item => {
        const itemDiv = document.createElement('div');
        const isOutOfStock = item?.out_of_stock ? 'disabled' : ''
        itemDiv.className = 'menu-item';
        itemDiv.innerHTML = `
            <h3 class="menu-item-title">${item.name} ${item?.out_of_stock ? ' - OUT OF STOCK' : ''}</h3>
            <!-- Added a specific class -->
            <p>${item.description}</p>
            <div class="sizes">

                ${item?.submenus.map((size) =>
                    `
                    <span>${size.name} - $${size.price}</span>

                    <div class="field is-grouped">
                        <p class="control mr-0">
                            <button 
                            ${isOutOfStock}
                            onclick="updateValue(${size.stripe_product_price_id}, 'decrement')"
                            type="button" class="button is-link mt-0">
                            ${minusSvg}
                            </button>
                        </p>
                        <p class="control mr-0">
                        <input 
                        ${isOutOfStock}
                        class="input is-primary mb-0 quantity-input-not-use"
                        step="1"
                        name="${size?.stripe_product_price_id}" 
                        id="${size?.stripe_product_price_id}" min="0" data-price="${size.price}" value="0" type="number" placeholder="0">
                        </p>
                        <p class="control">
                            <button 
                            ${isOutOfStock}
                            onclick="updateValue(${size.stripe_product_price_id}, 'increment')"
                            type="button" class="button is-danger mt-0">
                            ${plusSvg}
                            </button>
                        </p>
                    </div>`
                ).join('')}

            </div>

        `;
        menuContainer?.appendChild(itemDiv);
    });

    // not working...
    // Attach event listener to menu items for selection
    document.querySelectorAll('.quantity-input').forEach(item => 
        item.addEventListener('change', updateTotal));
}


/**
 * bug?: don't know why input is the actual html input, and not a string.
 * @param {*} input 
 * @param {*} action 
 */

async function updateValue(input, action) {
    console.log('calling updateValue', action, input)

    if (input) {
        if (action === 'increment') {
            input.stepUp()
        } else {
            input.stepDown()
        }
    }

    updateTotal()
}


function updateTotal() {
    let total = 0;
    document.querySelectorAll('.quantity-input').forEach(item => {
        console.log('counting item', item)
        total += parseInt(item.value) * parseFloat(item.dataset.price);
    });
    document.getElementById('total').value = total.toFixed(2);
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
document.getElementById('orderForm-not-use') // not using this for now.
?.addEventListener('submit', function(event) {
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
        // console.log('what item', item)
        const itemContainer = item.closest('.menu-item');
        const itemName = itemContainer.querySelector('.menu-item-title').innerText;
        const itemSize = item.dataset.value;
        const itemPrice = parseFloat(item.dataset.price);

        const itemStripePriceId = item.dataset.stripePriceId;

        
        order.items.push({ 
            name: itemName, 
            size: itemSize, 
            price: itemPrice,
            stripePriceId: itemStripePriceId,
        });
    });

    // Calculating total
    order.total = order.items.reduce((acc, item) => acc + item.price, 0);

    // Submitting the order to the server
    fetch(`${_BASE_URL}/submit-order`, { // Replace with your server's URL
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
