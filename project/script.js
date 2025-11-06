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

// Track new items to be printed on next KOT
let newOrderItems = {};

// GST default rate
const DEFAULT_GST_RATE = 5;

// Simple HTML escape for safe printing
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, s => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[s]));
}


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
        const restaurantGST = localStorage.getItem('restaurantGST') || '';
        const currentRestaurantId = localStorage.getItem('currentRestaurantId');
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
        const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
        const restaurantGSTFromArray = currentRestaurant ? (currentRestaurant.gst || '') : '';
        
        restaurantInfo = {
            name: restaurantName,
            address: restaurantAddress,
            phone: restaurantPhone,
            phone2: restaurantPhone2,
            gst: restaurantGSTFromArray || restaurantGST
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
    const restaurantGST = document.getElementById('restaurantGST').value || '';
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
            phone2: restaurantPhone2,
            gst: restaurantGST
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
                phone2: restaurantPhone2,
                gst: restaurantGST
            };
        } else {
            // Restaurant not found, create new
            restaurants.push({
                id: restaurantId,
                name: restaurantName,
                address: restaurantAddress,
                phone: restaurantPhone,
                phone2: restaurantPhone2,
                gst: restaurantGST
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
    localStorage.setItem('restaurantGST', restaurantGST);
    localStorage.setItem('salesPassword', salesPassword);
    
    // Update restaurant info object
    restaurantInfo = {
        name: restaurantName,
        address: restaurantAddress,
        phone: restaurantPhone,
        phone2: restaurantPhone2,
        gst: restaurantGST
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
    const restaurantGST = localStorage.getItem('restaurantGST') || '';
    
    // Get restaurant phone 2 from restaurants array if available
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
    const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
    const restaurantGSTFromArray = currentRestaurant ? (currentRestaurant.gst || '') : '';
    
    // Pre-fill the form
    document.getElementById('editRestaurantName').value = restaurantName;
    document.getElementById('editRestaurantAddress').value = restaurantAddress;
    document.getElementById('editRestaurantPhone').value = restaurantPhone;
    document.getElementById('editRestaurantPhone2').value = restaurantPhone2;
    document.getElementById('editRestaurantGST').value = restaurantGSTFromArray || restaurantGST;
    
    // Show the modal
    document.getElementById('editRestaurantModal').style.display = 'block';
}

// Save edited restaurant information
function saveEditedRestaurantInfo() {
    const restaurantName = document.getElementById('editRestaurantName').value;
    const restaurantAddress = document.getElementById('editRestaurantAddress').value;
    const restaurantPhone = document.getElementById('editRestaurantPhone').value;
    const restaurantPhone2 = document.getElementById('editRestaurantPhone2').value || '';
    const restaurantGST = document.getElementById('editRestaurantGST').value || '';
    
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
                phone2: restaurantPhone2,
                gst: restaurantGST
            };
        }
    }
    
    // Save restaurants
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    
    // For backward compatibility
    localStorage.setItem('restaurantName', restaurantName);
    localStorage.setItem('restaurantAddress', restaurantAddress);
    localStorage.setItem('restaurantPhone', restaurantPhone);
    localStorage.setItem('restaurantGST', restaurantGST);
    
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
            
            // Check if this item is new (not yet printed in KOT)
            const isNewItem = newOrderItems[tableId] && newOrderItems[tableId].find(ni => ni.id === item.id);
            const itemClass = isNewItem ? 'new-item' : '';
            
            orderItemElement.innerHTML = `
                <div class="order-item-name ${itemClass}">${item.name} ${isNewItem ? '(NEW)' : ''}</div>
                <div class="order-item-quantity">x${item.quantity}</div>
                <div class="order-item-price">₹${itemTotal.toFixed(2)}</div>
                <div class="order-item-remove" onclick="removeOrderItem(${tableId}, ${item.id})">✕</div>
            `;
            
            orderItemsContainer.appendChild(orderItemElement);
        });
        
        // Update totals
        const cgstRate = 0.025; // 2.5% CGST
        const sgstRate = 0.025; // 2.5% SGST
        const cgstAmount = subtotal * cgstRate;
        const sgstAmount = subtotal * sgstRate;
        const totalGstAmount = cgstAmount + sgstAmount;
        const total = subtotal + totalGstAmount;
        
        document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('gst').textContent = `₹${totalGstAmount.toFixed(2)} (CGST: ₹${cgstAmount.toFixed(2)} + SGST: ₹${sgstAmount.toFixed(2)})`;
        document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
        
        // Show KOT status
        const hasNewItems = newOrderItems[tableId] && newOrderItems[tableId].length > 0;
        if (hasNewItems) {
            const statusElement = document.createElement('div');
            statusElement.className = 'kot-status';
            statusElement.innerHTML = '<p style="color: #f59e0b; font-weight: bold;">⚠️ New items need to be sent to kitchen (KOT)</p>';
            orderItemsContainer.appendChild(statusElement);
        }
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
            printedItems: [], // Track items that have been printed in KOT
            timestamp: new Date().toISOString()
        };
        table.occupied = true;
    }
    
    // Initialize new items tracker for this table
    if (!newOrderItems[tableId]) {
        newOrderItems[tableId] = [];
    }
    
    // Check if item already exists in main order
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
    
    // Track new item for KOT printing
    const existingNewItem = newOrderItems[tableId].find(i => i.id === item.id);
    if (existingNewItem) {
        existingNewItem.quantity += 1;
    } else {
        newOrderItems[tableId].push({
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
        
        // Also remove from new items if present
        if (newOrderItems[tableId]) {
            const newItemIndex = newOrderItems[tableId].findIndex(ni => ni.id === itemId);
            if (newItemIndex !== -1) {
                const newItem = newOrderItems[tableId][newItemIndex];
                if (newItem.quantity > 1) {
                    newItem.quantity -= 1;
                } else {
                    newOrderItems[tableId].splice(newItemIndex, 1);
                }
            }
        }
        
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            tableOrders[tableId].items.splice(itemIndex, 1);
        }
        
        // If no items left, clear the order
        if (tableOrders[tableId].items.length === 0) {
            delete tableOrders[tableId];
            delete newOrderItems[tableId];
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

// Print KOT (Kitchen Order Ticket) for new items only
function printKOT() {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    const kotComment = (prompt('KOT comment (optional):') || '').trim();

    // Check if there are new items to print
    if (!newOrderItems[tableId] || newOrderItems[tableId].length === 0) {
        return;
    }
    
    // Get restaurant GST number and name
    const restaurantGST = localStorage.getItem('restaurantGST') || '';
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
    const gstNumber = currentRestaurant ? (currentRestaurant.gst || restaurantGST) : restaurantGST;
    const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant';
    const restaurantAddress = localStorage.getItem('restaurantAddress') || '';
    const restaurantPhone = localStorage.getItem('restaurantPhone') || '';
    const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
    
    // Create print content with iframe for direct printing
    const printContent = `
        <html>
        <head>
            <title>KOT - Table ${tableId}</title>
            <style>
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 16px; 
                    padding: 0;
                    margin: 0;
                    color: #000;
                    font-weight: 900;
                    line-height: 1.35;
                    letter-spacing: 0.4px;
                    width: 100%;
                    max-width: 100%;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                h2, h3 { 
                    margin: 2px 0; 
                    color: #000; 
                    font-weight: 900; 
                    font-size: 18px;
                }
                p { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900;
                    font-size: 14px;
                }
                .separator-line { 
                    margin: 2px 0;
                    width: 100%;
                    border-top: 2px solid #000;
                    height: 0;
                }
                .item-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 1px 0;
                    font-size: 14px;
                }
                .item-name {
                    font-weight: 900;
                    color: #000;
                }
                .item-qty {
                    font-weight: 900;
                    color: #000;
                }
                .center { 
                    text-align: center;
                }
                strong { 
                    font-weight: 900; 
                    color: #000;
                }
                @media print {
                    @page { 
                        margin: 0;
                        size: auto;
                    }
                    body { 
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        font-weight: bold;
                    }
                    * {
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="center">
                <h3>KITCHEN ORDER TICKET</h3>
                <p>Table: ${tableId}</p>
                <p>Time: ${new Date().toLocaleString()}</p>
                <div class="separator-line"></div>
                ${kotComment ? `<p><strong>Comment:</strong> ${escapeHtml(kotComment)}</p><div class="separator-line"></div>` : ''}
            </div>
            ${newOrderItems[tableId].map(item => `
                <div class="item-row">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">x${item.quantity}</span>
                </div>
            `).join('')}
            <div class="separator-line"></div>
            <div class="center">
                <p><strong>--- NEW ITEMS KOT ---</strong></p>
            </div>
        </body>
        </html>
    `;
    
    // Create hidden iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.write(printContent);
    doc.close();
    
    // Print directly without popup
    iframe.onload = function() {
        const iframeWindow = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        setTimeout(() => {
            try {
                // Focus and trigger print immediately
                iframeWindow.focus();
                iframeWindow.print();
                
                // Clean up after a short delay
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            } catch (e) {
                // Fallback: try alternative print method
                try {
                    iframeDoc.execCommand('print');
                } catch (e2) {
                    console.log('Print initiated');
                }
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }
        }, 50);
    };
    
    // Move new items to printed items
    if (!tableOrders[tableId].printedItems) {
        tableOrders[tableId].printedItems = [];
    }
    
    newOrderItems[tableId].forEach(newItem => {
        const existingPrintedItem = tableOrders[tableId].printedItems.find(pi => pi.id === newItem.id);
        if (existingPrintedItem) {
            existingPrintedItem.quantity += newItem.quantity;
        } else {
            tableOrders[tableId].printedItems.push({ ...newItem });
        }
    });
    
    // Clear new items after printing
    newOrderItems[tableId] = [];
    
    saveDataToStorage();
}

// Print final bill with all items and complete order
function printBill() {
    const tableId = parseInt(document.getElementById('tableNumber').textContent);
    if (!tableOrders[tableId] || tableOrders[tableId].items.length === 0) {
        return;
    }
    
    // If there are unprinted items, ask to print KOT first (keep original behavior)
    if (newOrderItems[tableId] && newOrderItems[tableId].length > 0) {
        if (confirm('There are new items that haven\'t been sent to kitchen. Print KOT first?')) {
            printKOT();
            // Wait a moment for KOT to process, then continue with bill
            setTimeout(() => {
                proceedWithBill(tableId);
            }, 2000);
            return;
        }
    }

    proceedWithBill(tableId);
}

// Proceed with printing the final bill
function proceedWithBill(tableId) {
    // Prompt for customer name (optional)
    const customerName = (prompt('Customer name (optional):') || '').trim();
    // Calculate total
    let subtotal = 0;
    tableOrders[tableId].items.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    
    const gstRate = 0.05; // 5% GST (2.5% CGST + 2.5% SGST)
    const cgstRate = 0.025; // 2.5% CGST
    const sgstRate = 0.025; // 2.5% SGST
    const cgstAmount = subtotal * cgstRate;
    const sgstAmount = subtotal * sgstRate;
    const totalGstAmount = cgstAmount + sgstAmount;
    const total = subtotal + totalGstAmount;
    
    // Get restaurant info
    const restaurantGST = localStorage.getItem('restaurantGST') || '';
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
    const gstNumber = currentRestaurant ? (currentRestaurant.gst || restaurantGST) : restaurantGST;
    const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant';
    const restaurantAddress = localStorage.getItem('restaurantAddress') || '';
    const restaurantPhone = localStorage.getItem('restaurantPhone') || '';
    const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
    
    // Create bill content
    const billContent = `
        <html>
        <head>
            <title>Bill - Table ${tableId}</title>
            <style>
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 16px; 
                    padding: 0;
                    margin: 0;
                    color: #000;
                    font-weight: 900;
                    line-height: 1.35;
                    letter-spacing: 0.4px;
                    width: 100%;
                    max-width: 100%;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                h2, h3 { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900; 
                    font-size: 18px;
                }
                p { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900;
                    font-size: 14px;
                }
.separator-line { 
                    margin: 1px 0;
                    width: 100%;
                    border-top: 2px solid #000;
                    height: 0;
                }
                .center { 
                    text-align: center;
                }
.bill-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: 900;
                    font-size: 14px;
                    margin: 1px 0;
                }
                .bill-item {
                    margin: 1px 0;
                }
.item-name {
font-weight: 900;
                    font-size: 14px;
                    color: #000;
                }
.item-details {
                    text-align: right;
                    font-size: 14px;
                    margin-top: 1px;
                    font-weight: 900;
                }
                .bill-total {
                    margin: 2px 0;
                }
.total-line {
                    display: flex;
                    justify-content: space-between;
                    font-size: 14px;
                    margin: 1px 0;
                }
.grand-total {
                    font-weight: 900;
                    font-size: 18px;
                    text-align: center;
                    margin: 4px 0;
                    color: #000;
                }
                strong { 
                    font-weight: 900; 
                    color: #000;
                }
                @media print {
                    @page { 
                        margin: 0;
                        size: auto;
                    }
                    body { 
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        font-weight: bold;
                    }
                    * {
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="center">
                <h2>${restaurantName}</h2>
                ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
                ${restaurantPhone ? `<p>Ph: ${restaurantPhone}${restaurantPhone2 ? ` / ${restaurantPhone2}` : ''}</p>` : ''}
                ${gstNumber ? `<p>GST NO: ${gstNumber}</p>` : ''}
                <div class="separator-line"></div>
            </div>
            <p>Customer: ${escapeHtml(customerName)}</p>
            <div class="separator-line"></div>
            <p>Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <p>Table: ${tableId}</p>
            <div class="separator-line"></div>
            <div class="bill-header">
                <span>Item</span>
                <span>Qty Price Amount</span>
            </div>
            <div class="separator-line"></div>
            ${tableOrders[tableId].items.map(item => `
                <div class="bill-item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">${item.quantity} ${item.price.toFixed(2)} ${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('')}
            <div class="separator-line"></div>
            <div class="bill-total">
                <div class="total-line">Total Qty: ${tableOrders[tableId].items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                <div class="total-line">Sub Total: ₹${subtotal.toFixed(2)}</div>
                <div class="total-line">SGST 2.5%: ₹${sgstAmount.toFixed(2)}</div>
                <div class="total-line">CGST 2.5%: ₹${cgstAmount.toFixed(2)}</div>
                <div class="separator-line"></div>
                <div class="grand-total">Grand Total: ₹${total.toFixed(2)}</div>
                <div class="separator-line"></div>
            </div>
            <div class="center">
                <p>Thank You, Visit Again!</p>
            </div>
        </body>
        </html>
    `;
    
    // Create hidden iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.write(billContent);
    doc.close();
    
    // Print directly without popup
    iframe.onload = function() {
        const iframeWindow = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        setTimeout(() => {
            try {
                // Focus and trigger print immediately
                iframeWindow.focus();
                iframeWindow.print();
                
                // Clean up after a short delay
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            } catch (e) {
                // Fallback: try alternative print method
                try {
                    iframeDoc.execCommand('print');
                } catch (e2) {
                    console.log('Print initiated');
                }
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }
        }, 50);
    };
    
    // Update day sales
    daySales.tableOrders += 1;
    daySales.totalSales += total;
    
    // Clear all order data and mark table as available
    delete tableOrders[tableId];
    delete newOrderItems[tableId];
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
    
    // Get restaurant GST number and name
    const restaurantGST = localStorage.getItem('restaurantGST') || '';
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
    const gstNumber = currentRestaurant ? (currentRestaurant.gst || restaurantGST) : restaurantGST;
    const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant';
    const restaurantAddress = localStorage.getItem('restaurantAddress') || '';
    const restaurantPhone = localStorage.getItem('restaurantPhone') || '';
    const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
    
    // Create delivery KOT content with darker styling
    const kotContent = `
        <html>
        <head>
            <title>Delivery KOT</title>
            <style>
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 14px; 
                    padding: 0;
                    margin: 0;
                    color: #000;
                    font-weight: 900;
                    line-height: 1.3;
                    letter-spacing: 0.4px;
                    width: 100%;
                    max-width: 100%;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                h2, h3 { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900; 
                    font-size: 16px;
                }
                p { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900;
                    font-size: 13px;
                }
.separator-line { 
                    margin: 1px 0;
                    width: 100%;
                    border-top: 2px solid #000;
                    height: 0;
                }
                .center { 
                    text-align: center;
                }
                strong { 
                    font-weight: 900; 
                    color: #000;
                }
                @media print {
                    @page { 
                        margin: 0;
                        size: auto;
                    }
                    body { 
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        font-weight: bold;
                    }
                    * {
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="center">
                <h3>DELIVERY KOT</h3>
                <div class="separator-line"></div>
            </div>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <p><strong>Phone:</strong> ${order.customerPhone}</p>
            <p><strong>Address:</strong> ${order.deliveryAddress}</p>
            <hr>
            ${order.items.map(item => `
                <p><strong>${item.name}</strong> x ${item.quantity}</p>
            `).join('')}
            <div class="separator-line"></div>
            <div class="center">
                <p><strong>--- DELIVERY KOT ---</strong></p>
            </div>
        </body>
        </html>
    `;
    
    // Create hidden iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.write(kotContent);
    doc.close();
    
    // Print directly without popup
    iframe.onload = function() {
        const iframeWindow = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        setTimeout(() => {
            try {
                // Focus and trigger print immediately
                iframeWindow.focus();
                iframeWindow.print();
                
                // Clean up after a short delay
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            } catch (e) {
                // Fallback: try alternative print method
                try {
                    iframeDoc.execCommand('print');
                } catch (e2) {
                    console.log('Print initiated');
                }
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }
        }, 50);
    };
    
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
    
    const cgstRate = 0.025; // 2.5% CGST
    const sgstRate = 0.025; // 2.5% SGST
    const cgstAmount = subtotal * cgstRate;
    const sgstAmount = subtotal * sgstRate;
    const totalGstAmount = cgstAmount + sgstAmount;
    const total = subtotal + totalGstAmount;
    
    // Get restaurant GST number and name
    const restaurantGST = localStorage.getItem('restaurantGST') || '';
    const currentRestaurantId = localStorage.getItem('currentRestaurantId');
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const currentRestaurant = restaurants.find(r => r.id === currentRestaurantId);
    const gstNumber = currentRestaurant ? (currentRestaurant.gst || restaurantGST) : restaurantGST;
    const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant';
    const restaurantAddress = localStorage.getItem('restaurantAddress') || '';
    const restaurantPhone = localStorage.getItem('restaurantPhone') || '';
    const restaurantPhone2 = currentRestaurant ? (currentRestaurant.phone2 || '') : '';
    
    // Create delivery bill content with darker styling
    const billContent = `
        <html>
        <head>
            <title>Delivery Bill</title>
            <style>
                * { 
                    margin: 0; 
                    padding: 0; 
                    box-sizing: border-box; 
                }
                body { 
                    font-family: 'Courier New', monospace; 
                    font-size: 14px; 
                    padding: 0;
                    margin: 0;
                    color: #000;
                    font-weight: 900;
                    line-height: 1.3;
                    letter-spacing: 0.4px;
                    width: 100%;
                    max-width: 100%;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                h2, h3 { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900; 
                    font-size: 16px;
                }
                p { 
                    margin: 1px 0; 
                    color: #000; 
                    font-weight: 900;
                    font-size: 14px;
                }
.separator-line { 
                    margin: 1px 0;
                    width: 100%;
                    border-top: 2px solid #000;
                    height: 0;
                }
                .center { 
                    text-align: center;
                }
.bill-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    font-size: 10px;
                    margin: 1px 0;
                }
                .bill-item {
                    margin: 1px 0;
                }
.item-name {
font-weight: 900;
                    font-size: 10px;
                    color: #000;
                }
.item-details {
                    text-align: right;
                    font-size: 10px;
                    margin-top: 1px;
                }
                .bill-total {
                    margin: 2px 0;
                }
.total-line {
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    margin: 1px 0;
                }
.grand-total {
                    font-weight: 900;
                    font-size: 12px;
                    text-align: center;
                    margin: 2px 0;
                    color: #000;
                }
                strong { 
                    font-weight: 900; 
                    color: #000;
                }
                @media print {
                    @page { 
                        margin: 0;
                        size: auto;
                    }
                    body { 
                        margin: 0;
                        padding: 0;
                        width: 100%;
                        font-weight: bold;
                    }
                    * {
                        -webkit-print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="center">
                <h2>${restaurantName}</h2>
                ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
                ${restaurantPhone ? `<p>Ph: ${restaurantPhone}${restaurantPhone2 ? ` / ${restaurantPhone2}` : ''}</p>` : ''}
                ${gstNumber ? `<p>GST NO: ${gstNumber}</p>` : ''}
                <p>--------------------------------</p>
            </div>
            <p>Customer: ${order.customerName}</p>
            <p>Phone: ${order.customerPhone}</p>
            <p>Address: ${order.deliveryAddress}</p>
            <p>Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <div class="separator-line"></div>
            <div class="bill-header">
                <span>Item</span>
                <span>Qty Price Amount</span>
            </div>
            <p>--------------------------------</p>
            ${order.items.map(item => `
                <div class="bill-item">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">${item.quantity} ${item.price.toFixed(2)} ${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('')}
            <div class="separator-line"></div>
            <div class="bill-total">
                <div class="total-line">Total Qty: ${order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                <div class="total-line">Sub Total: ₹${subtotal.toFixed(2)}</div>
                <div class="total-line">SGST 2.5%: ₹${sgstAmount.toFixed(2)}</div>
                <div class="total-line">CGST 2.5%: ₹${cgstAmount.toFixed(2)}</div>
                <div class="separator-line"></div>
                <div class="grand-total">Grand Total: ₹${total.toFixed(2)}</div>
                <div class="separator-line"></div>
            </div>
            <div class="center">
                <p>Thank You, Visit Again!</p>
            </div>
        </body>
        </html>
    `;
    
    // Create hidden iframe for direct printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.write(billContent);
    doc.close();
    
    // Print directly without popup
    iframe.onload = function() {
        const iframeWindow = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        setTimeout(() => {
            try {
                // Focus and trigger print immediately
                iframeWindow.focus();
                iframeWindow.print();
                
                // Clean up after a short delay
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            } catch (e) {
                // Fallback: try alternative print method
                try {
                    iframeDoc.execCommand('print');
                } catch (e2) {
                    console.log('Print initiated');
                }
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }
        }, 50);
    };
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

// Print both KOT and Bill for delivery order from modal
function printDeliveryKOTAndBill() {
    const customerName = document.getElementById('customerName').value || 'Guest';
    const customerPhone = document.getElementById('customerPhone').value || 'N/A';
    const deliveryAddress = document.getElementById('deliveryAddress').value || 'N/A';
    
    const orderItems = document.querySelectorAll('#deliveryOrderItems .order-item');
    if (orderItems.length === 0) {
        alert('Please add items to the order');
        return;
    }
    
    // Create new order
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
    
    // Print KOT first, then bill
    printDeliveryKOT(newOrderId);
    
    // Close modal and refresh delivery orders
    loadDeliveryOrders();
    closeModal('newDeliveryModal');
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
        categoryElement.innerHTML = `
            <span class="category-name">${category.name}</span>
            <div class="category-actions">
                <span onclick="editCategory(${category.id})" title="Edit Category">✎</span>
                <span onclick="deleteCategory(${category.id})" title="Delete Category">✕</span>
            </div>
        `;
        
        categoryElement.onclick = function(e) {
            // Don't trigger if clicking on action buttons
            if (e.target.tagName === 'SPAN' && e.target.parentElement.classList.contains('category-actions')) {
                return;
            }
            
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
                    <div class="item-header">
                        <h3>${item.name}</h3>
                        <div class="item-actions">
                            <button onclick="editMenuItem(${item.id})">Edit</button>
                            <button onclick="deleteMenuItem(${item.id})" class="delete">Delete</button>
                        </div>
                    </div>
                    <p>₹${item.price.toFixed(2)}</p>
                    ${item.includeGST ? `<p class="gst-info">GST: ${item.gstPercentage}% (included)</p>` : '<p class="gst-info">No GST</p>'}
                `;
                menuItemsContainer.appendChild(menuItemElement);
            });
            
            if (categoryItems.length === 0) {
                menuItemsContainer.innerHTML = '<p>No items in this category. <button onclick="showAddItemModal()">Add Item</button></p>';
            }
        };
        categoriesList.appendChild(categoryElement);
    });
    
    if (categories.length > 0) {
        const firstCategory = categoriesList.querySelector('.category-item');
        if (firstCategory) {
            firstCategory.click();
        }
    } else {
        categoriesList.innerHTML = '<p>No categories found. <button onclick="showAddCategoryModal()">Add Category</button></p>';
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

// Edit category function
function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const newName = prompt('Enter new category name:', category.name);
    if (newName && newName.trim() !== '' && newName !== category.name) {
        category.name = newName.trim();
        saveDataToStorage();
        loadCategories();
    }
}

// Delete category function
function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Check if category has items
    const categoryItems = menuItems.filter(item => item.categoryId === categoryId);
    let confirmMessage = `Are you sure you want to delete the category "${category.name}"?`;
    if (categoryItems.length > 0) {
        confirmMessage += `\n\nThis will also delete ${categoryItems.length} menu item(s) in this category.`;
    }
    
    if (confirm(confirmMessage)) {
        // Remove all items in this category
        menuItems = menuItems.filter(item => item.categoryId !== categoryId);
        // Remove the category
        categories = categories.filter(c => c.id !== categoryId);
        
        saveDataToStorage();
        loadCategories();
    }
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

// Edit menu item function
function editMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Load categories in edit modal
    const editItemCategorySelect = document.getElementById('editItemCategory');
    editItemCategorySelect.innerHTML = '';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (category.id === item.categoryId) {
            option.selected = true;
        }
        editItemCategorySelect.appendChild(option);
    });
    
    // Pre-fill the form with current values
    document.getElementById('editItemName').value = item.name;
    // Show the base price (without GST if GST is included)
    const basePrice = item.includeGST ? (item.price / (1 + (item.gstPercentage / 100))) : item.price;
    document.getElementById('editItemPrice').value = basePrice.toFixed(2);
    document.getElementById('editIncludeGST').checked = item.includeGST;
    document.getElementById('editGstPercentage').value = item.gstPercentage;
    
    // Show/hide GST fields
    toggleEditGSTField();
    
    // Store the item ID for saving
    document.getElementById('editItemModal').dataset.itemId = itemId;
    
    // Show modal
    document.getElementById('editItemModal').style.display = 'block';
}

// Toggle edit GST field visibility
function toggleEditGSTField() {
    const includeGST = document.getElementById('editIncludeGST').checked;
    document.getElementById('editGstPercentageGroup').style.display = includeGST ? 'block' : 'none';
}

// Save edited menu item
function saveEditMenuItem() {
    const itemId = parseInt(document.getElementById('editItemModal').dataset.itemId);
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const categoryId = parseInt(document.getElementById('editItemCategory').value);
    const itemName = document.getElementById('editItemName').value;
    let itemPrice = parseFloat(document.getElementById('editItemPrice').value);
    const includeGST = document.getElementById('editIncludeGST').checked;
    const gstPercentage = includeGST ? parseFloat(document.getElementById('editGstPercentage').value) : 0;
    
    if (!categoryId || !itemName || isNaN(itemPrice) || itemPrice <= 0) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    if (includeGST && (isNaN(gstPercentage) || gstPercentage <= 0)) {
        alert('Please enter a valid GST percentage');
        return;
    }
    
    // Calculate final price with GST if included
    if (includeGST) {
        itemPrice = itemPrice * (1 + (gstPercentage / 100));
    }
    
    // Update the item
    item.categoryId = categoryId;
    item.name = itemName;
    item.price = itemPrice;
    item.includeGST = includeGST;
    item.gstPercentage = gstPercentage;
    
    saveDataToStorage();
    loadCategories();
    closeModal('editItemModal');
}

// Delete menu item function
function deleteMenuItem(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        menuItems = menuItems.filter(i => i.id !== itemId);
        saveDataToStorage();
        loadCategories();
    }
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

// Table Management Functions
function showTableManagementModal() {
    const currentTableCount = tables.length;
    document.getElementById('tableCount').value = currentTableCount;
    document.getElementById('tableManagementModal').style.display = 'block';
}

function addTable() {
    const tableCount = parseInt(document.getElementById('tableCount').value);
    if (isNaN(tableCount) || tableCount < 1) {
        alert('Please enter a valid number of tables');
        return;
    }
    
    // Add one more table
    const newTableId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    tables.push({ id: newTableId, name: `Table ${newTableId}`, occupied: false });
    
    document.getElementById('tableCount').value = tables.length;
    alert(`Table ${newTableId} added successfully!`);
}

function removeTable() {
    if (tables.length <= 1) {
        alert('Cannot remove table. At least one table is required.');
        return;
    }
    
    const lastTable = tables[tables.length - 1];
    
    // Check if the last table is occupied
    if (lastTable.occupied) {
        alert(`Cannot remove Table ${lastTable.id} as it is currently occupied.`);
        return;
    }
    
    if (confirm(`Are you sure you want to remove Table ${lastTable.id}?`)) {
        tables.pop();
        document.getElementById('tableCount').value = tables.length;
        alert(`Table ${lastTable.id} removed successfully!`);
    }
}

function saveTableChanges() {
    const requestedCount = parseInt(document.getElementById('tableCount').value);
    const currentCount = tables.length;
    
    if (isNaN(requestedCount) || requestedCount < 1) {
        alert('Please enter a valid number of tables (minimum 1)');
        return;
    }
    
    if (requestedCount === currentCount) {
        closeModal('tableManagementModal');
        return;
    }
    
    if (requestedCount > currentCount) {
        // Add tables
        for (let i = currentCount; i < requestedCount; i++) {
            const newId = i + 1;
            tables.push({ id: newId, name: `Table ${newId}`, occupied: false });
        }
    } else {
        // Remove tables (check if any are occupied)
        const tablesToRemove = tables.slice(requestedCount);
        const occupiedTables = tablesToRemove.filter(t => t.occupied);
        
        if (occupiedTables.length > 0) {
            alert(`Cannot reduce tables. The following tables are occupied: ${occupiedTables.map(t => t.id).join(', ')}`);
            return;
        }
        
        if (confirm(`This will remove ${currentCount - requestedCount} table(s). Are you sure?`)) {
            tables = tables.slice(0, requestedCount);
        } else {
            return;
        }
    }
    
    saveDataToStorage();
    loadTables();
    closeModal('tableManagementModal');
    alert('Table configuration updated successfully!');
}

// Utility functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
