// Initialize data structures
let tables = [];
let categories = [];
let menuItems = [];
let tableOrders = {};
let deliveryOrders = [];
let restaurantInfo = {};
let daySales = {
    date: new Date().toLocaleDateString(),
    tableOrders: 0,
    deliveryOrders: 0,
    totalSales: 0
};

// GST default rate
const DEFAULT_GST_RATE = 5;

// Event listener for when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    loadDataFromStorage();
    
    // Check if restaurant info exists
    const restaurantName = localStorage.getItem('restaurantName');
    if (!restaurantName) {
        document.getElementById('restaurantSetupModal').style.display = 'block';
    } else {
        document.getElementById('sidebarRestaurantName').textContent = restaurantName;
        
        // Initialize restaurant info object
        const restaurantAddress = localStorage.getItem('restaurantAddress') || '';
        const restaurantPhone = localStorage.getItem('restaurantPhone') || '';
        const currentRestaurantId = localStorage.getItem('currentRestaurantId');
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
        const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
        
        restaurantInfo = {
            name: restaurantName,
            address: restaurantAddress,
            phone: restaurantPhone,
            phone2: restaurantPhone2
        };
        
        // Initialize the app components
        loadTables();
        loadCategories();
        loadDeliveryOrders();
        updateCurrentDate();
        updateSalesSummary();
    }
}

// Load data from local storage
function loadDataFromStorage() {
    // Load tables
    const savedTables = localStorage.getItem('tables');
    if (savedTables) {
        tables = JSON.parse(savedTables);
    } else {
        // Default to 10 tables if none exist
        tables = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Table ${i + 1}`, occupied: false }));
        localStorage.setItem('tables', JSON.stringify(tables));
    }
    
    // Load categories and menu items
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    } else {
        initializeSampleData();
    }
    
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
        menuItems = JSON.parse(savedMenuItems);
    }
    
    // Load table orders
    const savedTableOrders = localStorage.getItem('tableOrders');
    if (savedTableOrders) {
        tableOrders = JSON.parse(savedTableOrders);
    }
    
    // Load delivery orders
    const savedDeliveryOrders = localStorage.getItem('deliveryOrders');
    if (savedDeliveryOrders) {
        deliveryOrders = JSON.parse(savedDeliveryOrders);
    }
    
    // Load day sales
    const savedDaySales = localStorage.getItem('daySales');
    if (savedDaySales) {
        daySales = JSON.parse(savedDaySales);
        
        // Check if it's a new day
        const today = new Date().toLocaleDateString();
        if (daySales.date !== today) {
            resetDaySales();
        }
    } else {
        resetDaySales();
    }
}

// Save data to local storage
function saveDataToStorage() {
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    localStorage.setItem('tableOrders', JSON.stringify(tableOrders));
    localStorage.setItem('deliveryOrders', JSON.stringify(deliveryOrders));
    localStorage.setItem('daySales', JSON.stringify(daySales));
}

// Initialize sample data for categories and menu items
function initializeSampleData() {
    categories = [
        { id: 1, name: 'Starters' },
        { id: 2, name: 'Main Course' },
        { id: 3, name: 'Desserts' },
        { id: 4, name: 'Beverages' }
    ];
    
    menuItems = [
        { id: 1, categoryId: 1, name: 'Vegetable Spring Rolls', price: 120, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 2, categoryId: 1, name: 'Paneer Tikka', price: 180, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 3, categoryId: 1, name: 'Chicken Wings', price: 220, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 4, categoryId: 2, name: 'Butter Chicken', price: 320, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 5, categoryId: 2, name: 'Paneer Butter Masala', price: 280, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 6, categoryId: 2, name: 'Veg Biryani', price: 250, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 7, categoryId: 2, name: 'Chicken Biryani', price: 300, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 8, categoryId: 3, name: 'Gulab Jamun', price: 100, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 9, categoryId: 3, name: 'Ice Cream', price: 120, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 10, categoryId: 4, name: 'Soft Drink', price: 60, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 11, categoryId: 4, name: 'Masala Chai', price: 40, includeGST: false, gstPercentage: DEFAULT_GST_RATE },
        { id: 12, categoryId: 4, name: 'Fresh Lime Soda', price: 80, includeGST: false, gstPercentage: DEFAULT_GST_RATE }
    ];
    
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

// Reset day sales
function resetDaySales() {
    daySales = {
        date: new Date().toLocaleDateString(),
        tableOrders: 0,
        deliveryOrders: 0,
        totalSales: 0
    };
    localStorage.setItem('daySales', JSON.stringify(daySales));
    updateSalesSummary();
}

// Save restaurant information
function saveRestaurantInfo() {
    const restaurantName = document.getElementById('restaurantName').value;
    const restaurantAddress = document.getElementById('restaurantAddress').value;
    const restaurantPhone = document.getElementById('restaurantPhone').value;
    const restaurantPhone2 = document.getElementById('restaurantPhone2').value || '';
    const salesPassword = document.getElementById('salesPassword').value;
    
    if (!restaurantName || !restaurantAddress || !restaurantPhone) {
        alert('Please fill in required fields (name, address, primary phone)');
        return;
    }
    
    // Get existing restaurants or initialize empty array
    let restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    
    // Get current restaurant ID or create new one
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    let restaurantId = currentRestaurantId;
    
    if (!restaurantId) {
        // Create new restaurant
        restaurantId = Date.now().toString();
        restaurants.push({
            id: restaurantId,
            name: restaurantName,
            address: restaurantAddress,
            phone: restaurantPhone,
            phone2: restaurantPhone2
        });
    } else {
        // Update existing restaurant
        const index = restaurants.findIndex(r => r.id === restaurantId);
        if (index !== -1) {
            restaurants[index] = {
                ...restaurants[index],
                name: restaurantName,
                address: restaurantAddress,
                phone: restaurantPhone,
                phone2: restaurantPhone2
            };
        } else {
            // Restaurant not found, create new
            restaurants.push({
                id: restaurantId,
                name: restaurantName,
                address: restaurantAddress,
                phone: restaurantPhone,
                phone2: restaurantPhone2
            });
        }
    }
    
    // Save restaurants and current ID
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    localStorage.setItem('currentRestaurantId', restaurantId);
    
    // For backward compatibility
    localStorage.setItem('restaurantName', restaurantName);
    localStorage.setItem('restaurantAddress', restaurantAddress);
    localStorage.setItem('restaurantPhone', restaurantPhone);
    localStorage.setItem('salesPassword', salesPassword);
    
    // Update restaurant info object
    restaurantInfo = {
        name: restaurantName,
        address: restaurantAddress,
        phone: restaurantPhone,
        phone2: restaurantPhone2
    };
    
    document.getElementById('sidebarRestaurantName').textContent = restaurantName;
    document.getElementById('restaurantSetupModal').style.display = 'none';
    
    // Initialize the app components
    loadTables();
    loadCategories();
    updateCurrentDate();
    updateSalesSummary();
}

// Show edit restaurant modal
function showEditRestaurantModal() {
    // Get current restaurant details
    const restaurantName = localStorage.getItem('restaurantName') || '';
    const restaurantAddress = localStorage.getItem('restaurantAddress') || '';
    const restaurantPhone = localStorage.getItem('restaurantPhone') || '';
    
    // Get restaurant phone 2 from restaurants array if available
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
    const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
    
    // Pre-fill the form
    document.getElementById('editRestaurantName').value = restaurantName;
    document.getElementById('editRestaurantAddress').value = restaurantAddress;
    document.getElementById('editRestaurantPhone').value = restaurantPhone;
    document.getElementById('editRestaurantPhone2').value = restaurantPhone2;
    
    // Show the modal
    document.getElementById('editRestaurantModal').style.display = 'block';
}

// Save edited restaurant information
function saveEditedRestaurantInfo() {
    const restaurantName = document.getElementById('editRestaurantName').value;
    const restaurantAddress = document.getElementById('editRestaurantAddress').value;
    const restaurantPhone = document.getElementById('editRestaurantPhone').value;
    const restaurantPhone2 = document.getElementById('editRestaurantPhone2').value || '';
    
    if (!restaurantName || !restaurantAddress || !restaurantPhone) {
        alert('Please fill in required fields (name, address, primary phone)');
        return;
    }
    
    // Get existing restaurants or initialize empty array
    let restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    
    if (currentRestaurantId) {
        // Update existing restaurant
        const index = restaurants.findIndex(r => r.id === currentRestaurantId);
        if (index !== -1) {
            restaurants[index] = {
                ...restaurants[index],
                name: restaurantName,
                address: restaurantAddress,
                phone: restaurantPhone,
                phone2: restaurantPhone2
            };
        }
    }
    
    // Save restaurants
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    
    // For backward compatibility
    localStorage.setItem('restaurantName', restaurantName);
    localStorage.setItem('restaurantAddress', restaurantAddress);
    localStorage.setItem('restaurantPhone', restaurantPhone);
    
    // Update sidebar display
    document.getElementById('sidebarRestaurantName').textContent = restaurantName;
    
    // Close modal
    closeModal('editRestaurantModal');
    
    alert('Restaurant details updated successfully!');
}

// Show password modal
function showPasswordModal() {
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // Show modal
    document.getElementById('passwordModal').style.display = 'block';
}

// Change password function
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Get stored password
    const storedPassword = localStorage.getItem('salesPassword') || '';
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }
    
    if (currentPassword !== storedPassword) {
        alert('Current password is incorrect');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    if (newPassword.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }
    
    // Save new password
    localStorage.setItem('salesPassword', newPassword);
    
    alert('Password changed successfully!');
    closeModal('passwordModal');
}

// Show a specific section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show the selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update the active menu item
    const menuItems = document.querySelectorAll('.nav-menu li');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Find the menu item that corresponds to the section and make it active
    const activeMenuItem = Array.from(menuItems).find(item => {
        return item.getAttribute('onclick').includes(sectionId);
    });
    
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Special handling for sales section (password protection)
    if (sectionId === 'sales') {
        const storedPassword = localStorage.getItem('salesPassword');
        if (storedPassword) {
            const password = prompt('Enter password to access Sales section:');
            if (password !== storedPassword) {
                alert('Incorrect password');
                showSection('tableOrders'); // Default back to table orders
                return;
            }
        }
    }
}

// Load tables
function loadTables() {
    const tablesContainer = document.getElementById('tablesContainer');
    tablesContainer.innerHTML = '';
    
    tables.forEach(table => {
        const tableCard = document.createElement('div');
        tableCard.className = `table-card ${table.occupied ? 'occupied' : ''}`;
        tableCard.innerHTML = `
            <h3>Table ${table.id}</h3>
            <p>${table.occupied ? 'Occupied' : 'Available'}</p>
        `;
        tableCard.onclick = function() {
            manageTable(table.id);
        };
        
        tablesContainer.appendChild(tableCard);
    });
}

// Manage a specific table
function manageTable(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    document.getElementById('tableNumber').textContent = tableId;
    
    // Load categories in the order modal
    const menuCategoriesContainer = document.querySelector('#tableOrderModal .menu-categories');
    menuCategoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.textContent = category.name;
        categoryElement.onclick = function() {
            // Highlight the selected category
            document.querySelectorAll('#tableOrderModal .category-item').forEach(item => {
                item.classList.remove('active');
            });
            categoryElement.classList.add('active');
            
            // Load menu items for this category
            loadMenuItems(category.id, 'tableOrderModal');
        };
        
        menuCategoriesContainer.appendChild(categoryElement);
    });
    
    // Load existing order if table is occupied
    const orderItemsContainer = document.getElementById('orderItems');
    orderItemsContainer.innerHTML = '';
    
    if (table.occupied && tableOrders[tableId]) {
        const order = tableOrders[tableId];
        let subtotal = 0;
        
        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const orderItemElement = document.createElement('div');
            orderItemElement.className = 'order-item';
            orderItemElement.innerHTML = `
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-quantity">x${item.quantity}</div>
                <div class="order-item-price">₹${itemTotal.toFixed(2)}</div>
                <div class="order-item-remove" onclick="removeOrderItem(${tableId}, ${item.id})">✕</div>
            `;
            
            orderItemsContainer.appendChild(orderItemElement);
        });
        
        // Update totals
        const gstRate = 0.05; // 5% GST
        const gstAmount = subtotal * gstRate;
        const total = subtotal + gstAmount;
        
        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('gst').textContent = `₹${gstAmount.toFixed(2)}`;
        document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
    } else {
        // Reset totals for new order
        document.getElementById('subtotal').textContent = '₹0.00';
        document.getElementById('gst').textContent = '₹0.00';
        document.getElementById('total').textContent = '₹0.00';
    }
    
    // Reset menu items display to ensure it's visible
    const menuItemsContainer = document.querySelector('#tableOrderModal .menu-items-container');
    if (menuItemsContainer) {
        menuItemsContainer.style.display = 'grid';
    }
    
    // If there are categories, select the first one by default
    if (categories.length > 0) {
        const firstCategory = menuCategoriesContainer.querySelector('.category-item');
        if (firstCategory) {
            firstCategory.click();
        }
    }
    
    document.getElementById('tableOrderModal').style.display = 'block';
}

// Load menu items for a specific category
function loadMenuItems(categoryId, modalId) {
    const menuItemsContainer = document.querySelector(`#${modalId} .menu-items-container`);
    menuItemsContainer.innerHTML = '';
    
    const categoryItems = menuItems.filter(item => item.categoryId === categoryId);
    
    categoryItems.forEach(item => {
        const menuItemElement = document.createElement('div');
        menuItemElement.className = 'menu-item';
        menuItemElement.innerHTML = `
            <h4>${item.name}</h4>
            <p>₹${item.price.toFixed(2)}</p>
        `;
        menuItemElement.onclick = function() {
            if (modalId === 'tableOrderModal') {
                addItemToOrder(item);
            } else if (modalId === 'newDeliveryModal') {
                addItemToDeliveryOrder(item);
            }
        };
        
        menuItemsContainer.appendChild(menuItemElement);
    });
}

// Add item to table order
function addItemToOrder(item) {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Initialize order if it doesn't exist
    if (!tableOrders[tableId]) {
        tableOrders[tableId] = {
            id: tableId,
            items: [],
            timestamp: new Date().toISOString()
        };
        table.occupied = true;
    }
    
    // Check if item already exists in order
    const existingItem = tableOrders[tableId].items.find(i => i.id === item.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        tableOrders[tableId].items.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
        });
    }
    
    // Update the order display
    manageTable(tableId);
    saveDataToStorage();
}

// Remove item from table order
function removeOrderItem(tableId, itemId) {
    if (!tableOrders[tableId]) return;
    
    const itemIndex = tableOrders[tableId].items.findIndex(i => i.id === itemId);
    if (itemIndex !== -1) {
        const item = tableOrders[tableId].items[itemIndex];
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            tableOrders[tableId].items.splice(itemIndex, 1);
        }
        
        // If no items left, clear the order
        if (tableOrders[tableId].items.length === 0) {
            delete tableOrders[tableId];
            const table = tables.find(t => t.id === tableId);
            if (table) {
                table.occupied = false;
            }
        }
        
        // Update the order display
        manageTable(tableId);
        saveDataToStorage();
    }
}

// Print KOT (Kitchen Order Ticket)
function printKOT() {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    if (!tableOrders[tableId] || tableOrders[tableId].items.length === 0) {
        alert('No items in the order');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>KOT - Table ${tableId}</title></head>
        <body>
            <h2>KITCHEN ORDER TICKET</h2>
            <p>Table: ${tableId}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <hr>
            ${tableOrders[tableId].items.map(item => `
                <p>${item.name} x ${item.quantity}</p>
            `).join('')}
            <hr>
            <p style="text-align: center;">--- KOT ---</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    // Auto-print bill after KOT
    setTimeout(() => {
        printBill();
    }, 1000);
}

// Print bill and complete order
function printBill() {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    if (!tableOrders[tableId] || tableOrders[tableId].items.length === 0) {
        alert('No items in the order');
        return;
    }
    
    // Calculate total
    let subtotal = 0;
    tableOrders[tableId].items.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const gstRate = 0.05; // 5% GST
    const gstAmount = subtotal * gstRate;
    const total = subtotal + gstAmount;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>Bill - Table ${tableId}</title></head>
        <body>
            <h2>BILL</h2>
            <p>Table: ${tableId}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
            <hr>
            ${tableOrders[tableId].items.map(item => `
                <p>${item.name} x ${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}</p>
            `).join('')}
            <hr>
            <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
            <p>GST (5%): ₹${gstAmount.toFixed(2)}</p>
            <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
            <hr>
            <p style="text-align: center;">Thank you!</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    // Update day sales
    daySales.tableOrders += 1;
    daySales.totalSales += total;
    
    // Clear the order and mark table as available
    delete tableOrders[tableId];
    const table = tables.find(t => t.id === tableId);
    if (table) {
        table.occupied = false;
    }
    
    saveDataToStorage();
    updateSalesSummary();
    closeModal('tableOrderModal');
    loadTables();
}

// Save current order
function saveOrder() {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    if (!tableOrders[tableId] || tableOrders[tableId].items.length === 0) {
        alert('No items in the order');
        return;
    }
    
    // Mark table as occupied after saving order
    const table = tables.find(t => t.id === tableId);
    if (table && tableOrders[tableId] && tableOrders[tableId].items.length > 0) {
        table.occupied = true;
    }
    
    saveDataToStorage();
    closeModal('tableOrderModal');
    loadTables(); // Refresh table display to show occupied status
}

// Clear current order
function clearOrder() {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    if (!tableOrders[tableId]) return;
    
    if (confirm('Are you sure you want to clear this order?')) {
        delete tableOrders[tableId];
        const table = tables.find(t => t.id === tableId);
        if (table) {
            table.occupied = false;
        }
        
        saveDataToStorage();
        closeModal('tableOrderModal');
        loadTables();
    }
}

// Delivery order functions
function showNewDeliveryModal() {
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('deliveryOrderItems').innerHTML = '';
    document.getElementById('deliverySubtotal').textContent = '₹0.00';
    document.getElementById('deliveryGst').textContent = '₹0.00';
    document.getElementById('deliveryTotal').textContent = '₹0.00';
    
    // Load categories
    const menuCategoriesContainer = document.querySelector('#newDeliveryModal .menu-categories');
    menuCategoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.textContent = category.name;
        categoryElement.onclick = function() {
            document.querySelectorAll('#newDeliveryModal .category-item').forEach(item => {
                item.classList.remove('active');
            });
            categoryElement.classList.add('active');
            loadMenuItems(category.id, 'newDeliveryModal');
        };
        menuCategoriesContainer.appendChild(categoryElement);
    });
    
    if (categories.length > 0) {
        const firstCategory = menuCategoriesContainer.querySelector('.category-item');
        if (firstCategory) {
            firstCategory.click();
        }
    }
    
    document.getElementById('newDeliveryModal').style.display = 'block';
}

function addItemToDeliveryOrder(item) {
    const orderItemsContainer = document.getElementById('deliveryOrderItems');
    
    // Check if item already exists in order
    const existingItemElement = Array.from(orderItemsContainer.children).find(el => {
        return el.dataset.itemId === item.id.toString();
    });
    
    if (existingItemElement) {
        // Update existing item
        const quantityElement = existingItemElement.querySelector('.order-item-quantity');
        const priceElement = existingItemElement.querySelector('.order-item-price');
        
        const currentQuantity = parseInt(quantityElement.textContent.substring(1));
        const newQuantity = currentQuantity + 1;
        quantityElement.textContent = `x${newQuantity}`;
        
        const itemTotal = item.price * newQuantity;
        priceElement.textContent = `₹${itemTotal.toFixed(2)}`;
    } else {
        // Add new item
        const orderItemElement = document.createElement('div');
        orderItemElement.className = 'order-item';
        orderItemElement.dataset.itemId = item.id;
        orderItemElement.innerHTML = `
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-quantity">x1</div>
            <div class="order-item-price">₹${item.price.toFixed(2)}</div>
            <div class="order-item-remove" onclick="removeDeliveryOrderItem(this)">✕</div>
        `;
        orderItemsContainer.appendChild(orderItemElement);
    }
    
    updateDeliveryOrderTotals();
}

function removeDeliveryOrderItem(element) {
    const orderItem = element.parentElement;
    const quantityElement = orderItem.querySelector('.order-item-quantity');
    const currentQuantity = parseInt(quantityElement.textContent.substring(1));
    
    if (currentQuantity > 1) {
        const newQuantity = currentQuantity - 1;
        quantityElement.textContent = `x${newQuantity}`;
        
        const priceElement = orderItem.querySelector('.order-item-price');
        const itemPrice = parseFloat(priceElement.textContent.substring(1)) / currentQuantity;
        const newTotal = itemPrice * newQuantity;
        priceElement.textContent = `₹${newTotal.toFixed(2)}`;
    } else {
        orderItem.remove();
    }
    
    updateDeliveryOrderTotals();
}

function updateDeliveryOrderTotals() {
    const orderItems = document.querySelectorAll('#deliveryOrderItems .order-item');
    let subtotal = 0;
    
    orderItems.forEach(item => {
        const priceText = item.querySelector('.order-item-price').textContent;
        const price = parseFloat(priceText.substring(1));
        subtotal += price;
    });
    
    const gstRate = 0.05;
    const gstAmount = subtotal * gstRate;
    const total = subtotal + gstAmount;
    
    document.getElementById('deliverySubtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('deliveryGst').textContent = `₹${gstAmount.toFixed(2)}`;
    document.getElementById('deliveryTotal').textContent = `₹${total.toFixed(2)}`;
}

function saveDeliveryOrder() {
    const customerName = document.getElementById('customerName').value || 'Guest';
    const customerPhone = document.getElementById('customerPhone').value || 'N/A';
    const deliveryAddress = document.getElementById('deliveryAddress').value || 'N/A';
    
    const orderItems = document.querySelectorAll('#deliveryOrderItems .order-item');
    if (orderItems.length === 0) {
        alert('Please add items to the order');
        return;
    }
    
    const newOrderId = deliveryOrders.length > 0 ? Math.max(...deliveryOrders.map(o => o.id)) + 1 : 1;
    const items = [];
    
    orderItems.forEach(item => {
        const itemId = parseInt(item.dataset.itemId);
        const menuItem = menuItems.find(mi => mi.id === itemId);
        if (!menuItem) return;
        
        const quantityText = item.querySelector('.order-item-quantity').textContent;
        const quantity = parseInt(quantityText.substring(1));
        
        items.push({
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: quantity
        });
    });
    
    const newOrder = {
        id: newOrderId,
        customerName: customerName,
        customerPhone: customerPhone,
        deliveryAddress: deliveryAddress,
        items: items,
        timestamp: new Date().toISOString()
    };
    
    deliveryOrders.push(newOrder);
    saveDataToStorage();
    loadDeliveryOrders();
    closeModal('newDeliveryModal');
}

function printDeliveryKOT(orderId) {
    const order = deliveryOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>Delivery KOT</title></head>
        <body>
            <h2>DELIVERY KOT</h2>
            <p>Customer: ${order.customerName}</p>
            <p>Phone: ${order.customerPhone}</p>
            <p>Address: ${order.deliveryAddress}</p>
            <hr>
            ${order.items.map(item => `
                <p>${item.name} x ${item.quantity}</p>
            `).join('')}
            <hr>
            <p style="text-align: center;">--- KOT ---</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    // Auto-print bill
    setTimeout(() => {
        printDeliveryBill(orderId);
    }, 1000);
}

function printDeliveryBill(orderId) {
    const order = deliveryOrders.find(o => o.id === orderId);
    if (!order) return;
    
    let subtotal = 0;
    order.items.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const gstAmount = subtotal * 0.05;
    const total = subtotal + gstAmount;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head><title>Delivery Bill</title></head>
        <body>
            <h2>DELIVERY BILL</h2>
            <p>Customer: ${order.customerName}</p>
            <p>Phone: ${order.customerPhone}</p>
            <p>Address: ${order.deliveryAddress}</p>
            <hr>
            ${order.items.map(item => `
                <p>${item.name} x ${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}</p>
            `).join('')}
            <hr>
            <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
            <p>GST (5%): ₹${gstAmount.toFixed(2)}</p>
            <p><strong>Total: ₹${total.toFixed(2)}</strong></p>
            <hr>
            <p style="text-align: center;">Thank you!</p>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function loadDeliveryOrders() {
    const deliveryOrdersList = document.getElementById('deliveryOrdersList');
    deliveryOrdersList.innerHTML = '';
    
    deliveryOrders.forEach(order => {
        let subtotal = 0;
        order.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        const total = subtotal * 1.05;
        
        const orderCard = document.createElement('div');
        orderCard.className = 'delivery-order-card';
        orderCard.innerHTML = `
            <div class="delivery-order-info">
                <h3>${order.customerName}</h3>
                <p>${order.customerPhone}</p>
                <p>${order.deliveryAddress}</p>
                <p>Total: ₹${total.toFixed(2)}</p>
            </div>
            <div class="delivery-order-actions">
                <button onclick="printDeliveryKOT(${order.id})">KOT</button>
                <button onclick="printDeliveryBill(${order.id})">Bill</button>
                <button class="complete" onclick="completeDeliveryOrder(${order.id})">Complete</button>
            </div>
        `;
        deliveryOrdersList.appendChild(orderCard);
    });
    
    if (deliveryOrders.length === 0) {
        deliveryOrdersList.innerHTML = '<p>No delivery orders</p>';
    }
}

function completeDeliveryOrder(orderId) {
    const orderIndex = deliveryOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = deliveryOrders[orderIndex];
    let subtotal = 0;
    order.items.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    const total = subtotal * 1.05;
    
    daySales.deliveryOrders += 1;
    daySales.totalSales += total;
    
    deliveryOrders.splice(orderIndex, 1);
    saveDataToStorage();
    updateSalesSummary();
    loadDeliveryOrders();
}

// Operations section
function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.textContent = category.name;
        categoryElement.onclick = function() {
            document.querySelectorAll('#categoriesList .category-item').forEach(item => {
                item.classList.remove('active');
            });
            categoryElement.classList.add('active');
            
            const menuItemsContainer = document.getElementById('menuItems');
            menuItemsContainer.innerHTML = '';
            
            const categoryItems = menuItems.filter(item => item.categoryId === category.id);
            categoryItems.forEach(item => {
                const menuItemElement = document.createElement('div');
                menuItemElement.className = 'menu-item-card';
                menuItemElement.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>₹${item.price.toFixed(2)}</p>
                `;
                menuItemsContainer.appendChild(menuItemElement);
            });
        };
        categoriesList.appendChild(categoryElement);
    });
    
    if (categories.length > 0) {
        const firstCategory = categoriesList.querySelector('.category-item');
        if (firstCategory) {
            firstCategory.click();
        }
    }
}

function showAddCategoryModal() {
    document.getElementById('categoryName').value = '';
    document.getElementById('addCategoryModal').style.display = 'block';
}

function addCategory() {
    const categoryName = document.getElementById('categoryName').value;
    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }
    
    const newCategoryId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    categories.push({ id: newCategoryId, name: categoryName });
    
    saveDataToStorage();
    loadCategories();
    closeModal('addCategoryModal');
}

function showAddItemModal() {
    const itemCategorySelect = document.getElementById('itemCategory');
    itemCategorySelect.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        itemCategorySelect.appendChild(option);
    });
    
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('addItemModal').style.display = 'block';
}

function toggleGSTField() {
    const includeGST = document.getElementById('includeGST').checked;
    document.getElementById('gstPercentageGroup').style.display = includeGST ? 'block' : 'none';
}

function addMenuItem() {
    const categoryId = parseInt(document.getElementById('itemCategory').value);
    const itemName = document.getElementById('itemName').value;
    let itemPrice = parseFloat(document.getElementById('itemPrice').value);
    const includeGST = document.getElementById('includeGST').checked;
    const gstPercentage = includeGST ? parseFloat(document.getElementById('gstPercentage').value) : 0;
    
    if (!categoryId || !itemName || isNaN(itemPrice) || itemPrice <= 0) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    if (includeGST && (isNaN(gstPercentage) || gstPercentage <= 0)) {
        alert('Please enter a valid GST percentage');
        return;
    }
    
    if (includeGST) {
        itemPrice = itemPrice * (1 + (gstPercentage / 100));
    }
    
    const newItemId = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1;
    menuItems.push({
        id: newItemId,
        categoryId: categoryId,
        name: itemName,
        price: itemPrice,
        includeGST: includeGST,
        gstPercentage: gstPercentage
    });
    
    saveDataToStorage();
    loadCategories();
    closeModal('addItemModal');
}

// Sales section
function updateCurrentDate() {
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = `Date: ${daySales.date}`;
    }
}

function updateSalesSummary() {
    const salesSummaryElement = document.getElementById('salesSummary');
    if (salesSummaryElement) {
        salesSummaryElement.innerHTML = `
            <div class="sales-card">
                <h3>Table Orders</h3>
                <p>${daySales.tableOrders}</p>
            </div>
            <div class="sales-card">
                <h3>Delivery Orders</h3>
                <p>${daySales.deliveryOrders}</p>
            </div>
            <div class="sales-card">
                <h3>Total Sales</h3>
                <p>₹${daySales.totalSales.toFixed(2)}</p>
            </div>
        `;
    }
}

function printDaySummary() {
    const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant';
    
    let summaryText = `
${restaurantName}
Daily Sales Summary
Date: ${daySales.date}
------------------------------
Table Orders: ${daySales.tableOrders}
Delivery Orders: ${daySales.deliveryOrders}
Total Sales: ₹${daySales.totalSales.toFixed(2)}
------------------------------
`;
    
    alert(summaryText);
}

function resetDaySalesConfirm() {
    if (confirm('Are you sure you want to reset day sales? This action cannot be undone.')) {
        resetDaySales();
        alert('Day sales reset successfully!');
    }
}

// Utility functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}