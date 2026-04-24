// script.js - Complete Restaurant Management System
// Includes: Table orders, Delivery/Pickup with pending edit, GST display, large fonts, search, history, etc.

// ========== DATA STRUCTURES ==========
let tables = [];
let categories = [];
let menuItems = [];
let tableOrders = [];
let deliveryOrders = [];
let pickupOrders = [];
let pendingDeliveryOrders = [];
let pendingPickupOrders = [];
let unpaidBills = {};
let pendingPayments = {};
let orderHistory = {};
let restaurantInfo = {};
let securityQuestion = '';
let securityAnswer = '';
let daySales = {
    date: new Date().toLocaleDateString(),
    tableOrders: 0,
    deliveryOrders: 0,
    pickupOrders: 0,
    totalSales: 0
};

let newOrderItems = {};
let currentCategoryId = {};
let currentPaymentMethod = 'cash';
let currentBillData = null;
let currentTableIdForBill = null;
let currentPendingOrder = null;
let currentPendingOrderType = null;

// ========== HELPERS ==========
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

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// ========== STORAGE ==========
function loadDataFromStorage() {
    const savedTables = localStorage.getItem('tables');
    if (savedTables) tables = JSON.parse(savedTables);
    else tables = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Table ${i + 1}`, occupied: false }));
    
    const savedUnpaid = localStorage.getItem('unpaidBills');
    if (savedUnpaid) unpaidBills = JSON.parse(savedUnpaid);
    
    const savedPendingPayments = localStorage.getItem('pendingPayments');
    if (savedPendingPayments) pendingPayments = JSON.parse(savedPendingPayments);
    
    const savedOrderHistory = localStorage.getItem('orderHistory');
    if (savedOrderHistory) orderHistory = JSON.parse(savedOrderHistory);
    
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) categories = JSON.parse(savedCategories);
    else initializeSampleData();
    
    const savedMenu = localStorage.getItem('menuItems');
    if (savedMenu) menuItems = JSON.parse(savedMenu);
    
    const savedTableOrders = localStorage.getItem('tableOrders');
    if (savedTableOrders) tableOrders = JSON.parse(savedTableOrders);
    
    const savedDelivery = localStorage.getItem('deliveryOrders');
    if (savedDelivery) deliveryOrders = JSON.parse(savedDelivery);
    
    const savedPickup = localStorage.getItem('pickupOrders');
    if (savedPickup) pickupOrders = JSON.parse(savedPickup);
    
    const savedPendingDelivery = localStorage.getItem('pendingDeliveryOrders');
    if (savedPendingDelivery) pendingDeliveryOrders = JSON.parse(savedPendingDelivery);
    
    const savedPendingPickup = localStorage.getItem('pendingPickupOrders');
    if (savedPendingPickup) pendingPickupOrders = JSON.parse(savedPendingPickup);
    
    const savedDaySales = localStorage.getItem('daySales');
    if (savedDaySales) {
        daySales = JSON.parse(savedDaySales);
        if (daySales.date !== new Date().toLocaleDateString()) resetDaySales();
    } else resetDaySales();
}

function saveDataToStorage() {
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('unpaidBills', JSON.stringify(unpaidBills));
    localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    localStorage.setItem('tableOrders', JSON.stringify(tableOrders));
    localStorage.setItem('deliveryOrders', JSON.stringify(deliveryOrders));
    localStorage.setItem('pickupOrders', JSON.stringify(pickupOrders));
    localStorage.setItem('pendingDeliveryOrders', JSON.stringify(pendingDeliveryOrders));
    localStorage.setItem('pendingPickupOrders', JSON.stringify(pendingPickupOrders));
    localStorage.setItem('daySales', JSON.stringify(daySales));
}

function initializeSampleData() {
    categories = [
        { id: 1, name: 'Starters' },
        { id: 2, name: 'Main Course' },
        { id: 3, name: 'Desserts' },
        { id: 4, name: 'Beverages' }
    ];
    menuItems = [
        { id: 1, categoryId: 1, name: 'Vegetable Spring Rolls', price: 120 },
        { id: 2, categoryId: 1, name: 'Paneer Tikka', price: 180 },
        { id: 3, categoryId: 1, name: 'Chicken Wings', price: 220 },
        { id: 4, categoryId: 2, name: 'Butter Chicken', price: 320 },
        { id: 5, categoryId: 2, name: 'Paneer Butter Masala', price: 280 },
        { id: 6, categoryId: 2, name: 'Veg Biryani', price: 250 },
        { id: 7, categoryId: 2, name: 'Chicken Biryani', price: 300 },
        { id: 8, categoryId: 3, name: 'Gulab Jamun', price: 100 },
        { id: 9, categoryId: 3, name: 'Ice Cream', price: 120 },
        { id: 10, categoryId: 4, name: 'Soft Drink', price: 60 },
        { id: 11, categoryId: 4, name: 'Masala Chai', price: 40 },
        { id: 12, categoryId: 4, name: 'Fresh Lime Soda', price: 80 }
    ];
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

function resetDaySales() {
    daySales = { date: new Date().toLocaleDateString(), tableOrders: 0, deliveryOrders: 0, pickupOrders: 0, totalSales: 0 };
    localStorage.setItem('daySales', JSON.stringify(daySales));
    updateSalesSummary();
}

// ========== RESTAURANT SETUP & SECURITY ==========
function saveRestaurantInfo() {
    const name = document.getElementById('restaurantName').value;
    const address = document.getElementById('restaurantAddress').value;
    const phone = document.getElementById('restaurantPhone').value;
    const phone2 = document.getElementById('restaurantPhone2').value || '';
    const gst = document.getElementById('restaurantGST').value || '';
    const password = document.getElementById('salesPassword').value;
    const secQ = document.getElementById('securityQuestion').value;
    const secA = document.getElementById('securityAnswer').value;
    if (!name || !address || !phone) return alert('Please fill required fields');
    if (!password) return alert('Set a sales password');
    if (!secQ || !secA) return alert('Set security question and answer');
    
    let restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    let id = localStorage.getItem('currentRestaurantId') || Date.now().toString();
    const index = restaurants.findIndex(r => r.id === id);
    const newRest = { id, name, address, phone, phone2, gst };
    if (index === -1) restaurants.push(newRest);
    else restaurants[index] = newRest;
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    localStorage.setItem('currentRestaurantId', id);
    localStorage.setItem('restaurantName', name);
    localStorage.setItem('restaurantAddress', address);
    localStorage.setItem('restaurantPhone', phone);
    localStorage.setItem('restaurantGST', gst);
    localStorage.setItem('salesPassword', password);
    localStorage.setItem('securityQuestion', secQ);
    localStorage.setItem('securityAnswer', secA.toLowerCase().trim());
    
    document.getElementById('sidebarRestaurantName').textContent = name;
    document.getElementById('restaurantSetupModal').style.display = 'none';
    loadTables(); loadCategories(); updateCurrentDate(); updateSalesSummary();
}

function showEditRestaurantModal() {
    const name = localStorage.getItem('restaurantName') || '';
    const address = localStorage.getItem('restaurantAddress') || '';
    const phone = localStorage.getItem('restaurantPhone') || '';
    const gst = localStorage.getItem('restaurantGST') || '';
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const curr = restaurants.find(r => r.id === localStorage.getItem('currentRestaurantId'));
    document.getElementById('editRestaurantName').value = name;
    document.getElementById('editRestaurantAddress').value = address;
    document.getElementById('editRestaurantPhone').value = phone;
    document.getElementById('editRestaurantPhone2').value = curr?.phone2 || '';
    document.getElementById('editRestaurantGST').value = curr?.gst || gst;
    document.getElementById('editRestaurantModal').style.display = 'block';
}

function saveEditedRestaurantInfo() {
    const name = document.getElementById('editRestaurantName').value;
    const address = document.getElementById('editRestaurantAddress').value;
    const phone = document.getElementById('editRestaurantPhone').value;
    const phone2 = document.getElementById('editRestaurantPhone2').value || '';
    const gst = document.getElementById('editRestaurantGST').value || '';
    if (!name || !address || !phone) return alert('Fill required fields');
    let restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const id = localStorage.getItem('currentRestaurantId');
    const idx = restaurants.findIndex(r => r.id === id);
    if (idx !== -1) restaurants[idx] = { ...restaurants[idx], name, address, phone, phone2, gst };
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    localStorage.setItem('restaurantName', name);
    localStorage.setItem('restaurantAddress', address);
    localStorage.setItem('restaurantPhone', phone);
    localStorage.setItem('restaurantGST', gst);
    document.getElementById('sidebarRestaurantName').textContent = name;
    closeModal('editRestaurantModal');
    alert('Updated');
}

function showPasswordModal() {
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordModal').style.display = 'block';
    const has = localStorage.getItem('securityQuestion');
    document.getElementById('setupSecurityBtn').style.display = has ? 'none' : 'block';
}

function setupSecurityQuestion() {
    const existing = localStorage.getItem('securityQuestion');
    if (existing && !confirm('Change existing security question?')) return;
    const q = prompt('New security question:');
    if (!q) return;
    const a = prompt('Answer:');
    if (!a) return;
    localStorage.setItem('securityQuestion', q);
    localStorage.setItem('securityAnswer', a.toLowerCase().trim());
    alert('Security question set');
}

function forgotPassword() {
    const q = localStorage.getItem('securityQuestion');
    if (!q) return alert('No security question set. Use "Setup Security" first.');
    const ans = prompt(`Security Question: ${q}\nAnswer:`);
    if (!ans) return;
    if (ans.toLowerCase().trim() !== localStorage.getItem('securityAnswer')) return alert('Wrong answer');
    const newPwd = prompt('Enter new password:');
    if (newPwd && newPwd.length >= 4) {
        localStorage.setItem('salesPassword', newPwd);
        alert('Password reset');
        closeModal('passwordModal');
    } else alert('Password must be at least 4 chars');
}

function changePassword() {
    const cur = document.getElementById('currentPassword').value;
    const newP = document.getElementById('newPassword').value;
    const conf = document.getElementById('confirmPassword').value;
    const stored = localStorage.getItem('salesPassword');
    if (cur !== stored) return alert('Current password incorrect');
    if (newP !== conf) return alert('New passwords do not match');
    if (newP.length < 4) return alert('Password too short');
    localStorage.setItem('salesPassword', newP);
    alert('Password changed');
    closeModal('passwordModal');
}

function promptWithForgot(msg) {
    let pwd = prompt(msg + '\n\n(Type "forgot" to reset)');
    if (pwd === 'forgot' || pwd === 'FORGOT') { forgotPassword(); return prompt(msg); }
    return pwd;
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    const activeLi = Array.from(document.querySelectorAll('.nav-menu li')).find(li => li.getAttribute('onclick').includes(sectionId));
    if (activeLi) activeLi.classList.add('active');
    if (sectionId === 'sales') {
        const stored = localStorage.getItem('salesPassword');
        if (stored && promptWithForgot('Enter password to access Sales:') !== stored) {
            alert('Incorrect');
            showSection('tableOrders');
        }
    }
    if (sectionId === 'orderHistory') loadOrderHistory();
    if (sectionId === 'pendingDeliveryOrders') loadPendingDeliveryOrders();
    if (sectionId === 'pendingPickupOrders') loadPendingPickupOrders();
}

// ========== TABLE ORDERS ==========
function loadTables() {
    const container = document.getElementById('tablesContainer');
    container.innerHTML = '';
    tables.forEach(table => {
        const hasPending = pendingPayments[table.id] && !pendingPayments[table.id].settled;
        const hasUnpaid = unpaidBills[table.id] && !unpaidBills[table.id].paid;
        let statusClass = '', statusText = '', extra = '';
        if (hasPending) {
            statusClass = 'pending-payment';
            statusText = '💰 Pending Collection';
            extra = `<p class="pending-amount">To Collect: ₹${pendingPayments[table.id].amount.toFixed(2)}</p><div class="pending-badge">💰 SETTLE</div>`;
        } else if (hasUnpaid) {
            statusClass = 'unpaid';
            statusText = 'Pending Payment';
            extra = `<p class="unpaid-amount">Bill: ₹${unpaidBills[table.id].amount.toFixed(2)}</p><div class="unpaid-badge">💰 PENDING</div>`;
        } else if (table.occupied) {
            statusClass = 'occupied';
            statusText = 'Occupied';
        } else {
            statusClass = 'available';
            statusText = 'Available';
        }
        const card = document.createElement('div');
        card.className = `table-card ${statusClass}`;
        card.innerHTML = `<h3>Table ${table.id}</h3><p>${statusText}</p>${extra}`;
        card.onclick = () => {
            if (hasPending && confirm(`Table ${table.id} pending ₹${pendingPayments[table.id].amount}\nMark as collected?`)) settlePayment(table.id);
            else manageTable(table.id);
        };
        container.appendChild(card);
    });
}

function settlePayment(tableId) {
    if (!pendingPayments[tableId]) return;
    const p = pendingPayments[tableId];
    daySales.tableOrders += 1;
    daySales.totalSales += p.amount;
    if (!orderHistory[tableId]) orderHistory[tableId] = [];
    orderHistory[tableId].unshift({ orderId: orderHistory[tableId].length+1, amount: p.amount, items: p.items, timestamp: p.timestamp, paymentMethod: p.paymentMethod || 'Cash' });
    if (orderHistory[tableId].length > 20) orderHistory[tableId] = orderHistory[tableId].slice(0,20);
    delete pendingPayments[tableId];
    delete tableOrders[tableId];
    delete newOrderItems[tableId];
    delete unpaidBills[tableId];
    const table = tables.find(t => t.id === tableId);
    if (table) table.occupied = false;
    saveDataToStorage(); updateSalesSummary(); loadTables();
    showToast('Payment collected!', 'success');
    closeModal('paymentModal'); closeModal('tableOrderModal');
}

function manageTable(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    document.getElementById('tableNumber').textContent = tableId;
    currentTableIdForBill = tableId;
    const catContainer = document.querySelector('#tableOrderModal .menu-categories');
    catContainer.innerHTML = '';
    categories.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category-item';
        el.textContent = cat.name;
        el.onclick = () => {
            document.querySelectorAll('#tableOrderModal .category-item').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            currentCategoryId[`tableOrderModal_${tableId}`] = cat.id;
            loadMenuItems(cat.id, 'tableOrderModal');
        };
        catContainer.appendChild(el);
    });
    const orderItemsDiv = document.getElementById('orderItems');
    orderItemsDiv.innerHTML = '';
    const hasUnpaid = unpaidBills[tableId] && !unpaidBills[tableId].paid;
    if (hasUnpaid) {
        const bill = unpaidBills[tableId];
        orderItemsDiv.innerHTML = `<div style="background:#fee2e2; padding:20px; border-radius:12px;"><h4>⚠️ Unpaid Bill ₹${bill.amount.toFixed(2)}</h4><button onclick="showPaymentModal(${tableId})">Pay Now</button> <button onclick="addMoreItemsToBill(${tableId})">Add Items</button></div>`;
        document.getElementById('total').textContent = `₹${bill.amount.toFixed(2)}`;
        const menuItemsDiv = document.querySelector('#tableOrderModal .menu-items-container');
        if (menuItemsDiv) menuItemsDiv.innerHTML = '<div style="padding:40px; text-align:center;">Settle bill to add items</div>';
        document.querySelectorAll('#tableOrderModal .order-actions button').forEach(btn => { if(btn.textContent !== 'Clear') btn.disabled = true; });
    } else if (table.occupied && tableOrders[tableId]) {
        let total = 0;
        tableOrders[tableId].items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            const isNew = newOrderItems[tableId]?.some(ni => ni.id === item.id);
            orderItem.innerHTML = `<div class="order-item-name ${isNew ? 'new-item' : ''}">${item.name} ${isNew ? '(NEW)' : ''}</div><div class="order-item-quantity">x${item.quantity}</div><div class="order-item-price">₹${itemTotal.toFixed(2)}</div><div class="order-item-remove" onclick="removeOrderItem(${tableId},${item.id})">✕</div>`;
            orderItemsDiv.appendChild(orderItem);
        });
        document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
        if (newOrderItems[tableId]?.length) orderItemsDiv.innerHTML += '<div class="kot-status">⚠️ New items need KOT</div>';
        document.querySelectorAll('#tableOrderModal .order-actions button').forEach(btn => btn.disabled = false);
    } else {
        document.getElementById('total').textContent = '₹0.00';
        document.querySelectorAll('#tableOrderModal .order-actions button').forEach(btn => btn.disabled = false);
    }
    const menuItemsDiv = document.querySelector('#tableOrderModal .menu-items-container');
    if (menuItemsDiv && !hasUnpaid) {
        menuItemsDiv.style.display = 'grid';
        menuItemsDiv.innerHTML = '';
        if (categories.length) {
            const savedId = currentCategoryId[`tableOrderModal_${tableId}`];
            let target = savedId ? Array.from(catContainer.children).find(c => c.textContent === categories.find(cat => cat.id === savedId)?.name) : null;
            if (target) target.click();
            else catContainer.firstChild?.click();
        }
    }
    document.getElementById('tableOrderModal').style.display = 'block';
}

function addMoreItemsToBill(tableId) {
    const payModal = document.getElementById('paymentModal');
    if (payModal) payModal.style.display = 'none';
    if (!tableOrders[tableId]) tableOrders[tableId] = { id: tableId, items: [], printedItems: [], timestamp: new Date().toISOString() };
    const table = tables.find(t => t.id === tableId);
    if (table) table.occupied = true;
    manageTable(tableId);
    showToast('Add more items', 'info');
}

function addItemToExistingBill(tableId, item) {
    const bill = unpaidBills[tableId];
    if (!bill) return;
    const existing = bill.items.find(i => i.id === item.id);
    if (existing) existing.quantity++;
    else bill.items.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    bill.amount = bill.items.reduce((s,i)=> s + i.price*i.quantity,0);
    bill.timestamp = new Date().toISOString();
    if (!tableOrders[tableId]) tableOrders[tableId] = { id: tableId, items: [], printedItems: [], timestamp: new Date().toISOString() };
    const ordItem = tableOrders[tableId].items.find(i => i.id === item.id);
    if (ordItem) ordItem.quantity++;
    else tableOrders[tableId].items.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    if (!newOrderItems[tableId]) newOrderItems[tableId] = [];
    const newItem = newOrderItems[tableId].find(i => i.id === item.id);
    if (newItem) newItem.quantity++;
    else newOrderItems[tableId].push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    saveDataToStorage();
    showToast(`${item.name} added`, 'success');
    closeModal('tableOrderModal');
    setTimeout(() => showPaymentModal(tableId), 300);
}

function addItemToOrder(item) {
    const tid = parseInt(document.getElementById('tableNumber').textContent);
    if (!tableOrders[tid]) { tableOrders[tid] = { id: tid, items: [], printedItems: [], timestamp: new Date().toISOString() }; tables.find(t=>t.id===tid).occupied = true; }
    if (!newOrderItems[tid]) newOrderItems[tid] = [];
    const existing = tableOrders[tid].items.find(i=>i.id===item.id);
    if (existing) existing.quantity++;
    else tableOrders[tid].items.push({ id: item.id, name: item.name, price: item.price, quantity:1 });
    const newEx = newOrderItems[tid].find(i=>i.id===item.id);
    if (newEx) newEx.quantity++;
    else newOrderItems[tid].push({ id:item.id, name:item.name, price:item.price, quantity:1 });
    manageTable(tid);
    saveDataToStorage();
    showToast(`${item.name} added`, 'success');
}

function removeOrderItem(tid, iid) {
    if (!tableOrders[tid]) return;
    const idx = tableOrders[tid].items.findIndex(i=>i.id===iid);
    if(idx===-1) return;
    const item = tableOrders[tid].items[idx];
    if(newOrderItems[tid]) {
        const ni = newOrderItems[tid].find(n=>n.id===iid);
        if(ni) { if(ni.quantity>1) ni.quantity--; else newOrderItems[tid].splice(newOrderItems[tid].indexOf(ni),1); }
    }
    if(item.quantity>1) item.quantity--;
    else tableOrders[tid].items.splice(idx,1);
    if(tableOrders[tid].items.length===0) { delete tableOrders[tid]; delete newOrderItems[tid]; tables.find(t=>t.id===tid).occupied = false; }
    manageTable(tid);
    saveDataToStorage();
    showToast('Item removed','info');
}

function printKOT() {
    const tid = parseInt(document.getElementById('tableNumber').textContent);
    const comment = prompt('KOT comment (optional):') || '';
    if(!newOrderItems[tid] || !newOrderItems[tid].length) return showToast('No new items','warning');
    const rName = localStorage.getItem('restaurantName') || 'Restaurant';
    const rAdd = localStorage.getItem('restaurantAddress') || '';
    const rPhone = localStorage.getItem('restaurantPhone') || '';
    const content = `<html><head><title>KOT Table ${tid}</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h3{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .item-row{display:flex;justify-content:space-between;margin:2px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h3>KITCHEN ORDER TICKET</h3><p>Table: ${tid}</p><p>Time: ${new Date().toLocaleString()}</p><div class="separator-line"></div>${comment?`<p><strong>Comment:</strong> ${escapeHtml(comment)}</p><div class="separator-line"></div>`:''}</div>${newOrderItems[tid].map(i=>`<div class="item-row"><span>${i.name}</span><span>x${i.quantity}</span></div>`).join('')}<div class="separator-line"></div><div class="center"><p>--- NEW ITEMS ---</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(content); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
    if(!tableOrders[tid].printedItems) tableOrders[tid].printedItems = [];
    newOrderItems[tid].forEach(ni=>{const existing = tableOrders[tid].printedItems.find(p=>p.id===ni.id); if(existing) existing.quantity+=ni.quantity; else tableOrders[tid].printedItems.push({...ni});});
    newOrderItems[tid] = [];
    saveDataToStorage();
    showToast('KOT sent','success');
}

function printBill() {
    const tid = parseInt(document.getElementById('tableNumber').textContent);
    const hasUnpaid = unpaidBills[tid] && !unpaidBills[tid].paid;
    if (hasUnpaid) {
        if (tableOrders[tid] && tableOrders[tid].items.length) {
            const existing = unpaidBills[tid];
            tableOrders[tid].items.forEach(newItem => {
                const ex = existing.items.find(i=>i.id===newItem.id);
                if(ex) ex.quantity += newItem.quantity;
                else existing.items.push({...newItem});
            });
            existing.amount = existing.items.reduce((s,i)=>s + i.price*i.quantity,0);
            existing.timestamp = new Date().toISOString();
            unpaidBills[tid] = existing;
            delete tableOrders[tid]; delete newOrderItems[tid];
            saveDataToStorage();
        }
        closeModal('tableOrderModal');
        setTimeout(()=>showPaymentModal(tid),300);
        return;
    }
    if (!tableOrders[tid] || !tableOrders[tid].items.length) return showToast('No items','warning');
    if (newOrderItems[tid] && newOrderItems[tid].length && confirm('Send new items to kitchen first?')) {
        printKOT();
        setTimeout(()=>finalizeBill(tid),2000);
    } else finalizeBill(tid);
}

function finalizeBill(tid) {
    const total = tableOrders[tid].items.reduce((s,i)=>s + i.price*i.quantity,0);
    unpaidBills[tid] = { amount: total, items: [...tableOrders[tid].items], timestamp: new Date().toISOString(), paid: false };
    delete tableOrders[tid]; delete newOrderItems[tid];
    saveDataToStorage(); updateSalesSummary(); closeModal('tableOrderModal'); loadTables();
    setTimeout(()=>showPaymentModal(tid),300);
}

function printFinalBill(tid, bill) {
    const rName = localStorage.getItem('restaurantName') || 'Restaurant';
    const rAdd = localStorage.getItem('restaurantAddress') || '';
    const rPhone = localStorage.getItem('restaurantPhone') || '';
    const gst = localStorage.getItem('restaurantGST') || '';
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const curr = restaurants.find(r=>r.id===localStorage.getItem('currentRestaurantId'));
    const finalGST = curr?.gst || gst;
    const rPhone2 = curr?.phone2 || '';
    const content = `<html><head><title>Bill Table ${tid}</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h2{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .bill-header{display:flex;justify-content:space-between;font-size:14px;} .bill-item{margin:2px 0;} .grand-total{font-size:18px;text-align:center;margin:4px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h2>${rName}</h2>${rAdd?`<p>${rAdd}</p>`:''}${rPhone?`<p>Ph: ${rPhone}${rPhone2?` / ${rPhone2}`:''}</p>`:''}${finalGST?`<p>GST: ${finalGST}</p>`:''}<div class="separator-line"></div></div><p>Date: ${new Date().toLocaleString()}</p><p>Table: ${tid}</p><div class="separator-line"></div><div class="bill-header"><span>Item</span><span>Qty Price Amount</span></div><div class="separator-line"></div>${bill.items.map(i=>`<div class="bill-item"><div class="item-name">${i.name}</div><div class="item-details" style="text-align:right">${i.quantity} ${i.price.toFixed(2)} ${(i.price*i.quantity).toFixed(2)}</div></div>`).join('')}<div class="separator-line"></div><div class="grand-total">Total: ₹${bill.amount.toFixed(2)}</div><div class="separator-line"></div><div class="center"><p>Thank You, Visit Again!</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(content); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
}

function showPaymentModal(tid) {
    const bill = unpaidBills[tid];
    if (!bill) return;
    currentBillData = bill; currentTableIdForBill = tid;
    const modalHtml = `
    <div id="paymentModal" class="modal" style="display:block;">
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header"><h2>Payment - Table ${tid}</h2><span class="close-modal" onclick="closeModal('paymentModal')">&times;</span></div>
            <div class="modal-body">
                <div style="background:#f3f4f6; padding:15px; border-radius:10px;">
                    <h3>Bill Amount: ₹${bill.amount.toFixed(2)}</h3>
                    <div id="billItemsList">${bill.items.map((item,idx)=>`<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>${item.name}</span><span><button onclick="editBillItemQuantity(${tid},${idx},'dec')">-</button> ${item.quantity} <button onclick="editBillItemQuantity(${tid},${idx},'inc')">+</button></span><span>₹${(item.price*item.quantity).toFixed(2)}</span><button onclick="removeBillItem(${tid},${idx})">✕</button></div>`).join('')}</div>
                    <div style="margin-top:10px;"><strong>Total: ₹<span id="paymentTotal">${bill.amount.toFixed(2)}</span></strong></div>
                </div>
                <div class="form-group"><label>Payment Method:</label><div><label><input type="radio" name="paymentMethod" value="cash" checked> 💵 Cash</label> <label><input type="radio" name="paymentMethod" value="card"> 💳 Card</label> <label><input type="radio" name="paymentMethod" value="upi"> 📱 UPI</label></div></div>
                <div style="display:flex; gap:10px; margin-top:20px;"><button onclick="closeModal('paymentModal'); addMoreItemsToBill(${tid})" style="background:#f59e0b; flex:1;">➕ Add Items</button><button onclick="confirmPayment(${tid})" style="background:#10b981; flex:1;">✓ Confirm Payment</button><button onclick="closeModal('paymentModal')">Cancel</button></div>
            </div>
        </div>
    </div>`;
    const existing = document.getElementById('paymentModal');
    if(existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function editBillItemQuantity(tid, idx, act) {
    const bill = unpaidBills[tid];
    if(!bill) return;
    if(act === 'inc') bill.items[idx].quantity++;
    else if(act === 'dec' && bill.items[idx].quantity > 1) bill.items[idx].quantity--;
    bill.amount = bill.items.reduce((s,i)=>s + i.price*i.quantity,0);
    document.getElementById('paymentTotal').textContent = `₹${bill.amount.toFixed(2)}`;
    const container = document.getElementById('billItemsList');
    container.innerHTML = bill.items.map((item,i)=>`<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>${item.name}</span><span><button onclick="editBillItemQuantity(${tid},${i},'dec')">-</button> ${item.quantity} <button onclick="editBillItemQuantity(${tid},${i},'inc')">+</button></span><span>₹${(item.price*item.quantity).toFixed(2)}</span><button onclick="removeBillItem(${tid},${i})">✕</button></div>`).join('');
    saveDataToStorage();
}

function removeBillItem(tid, idx) {
    const bill = unpaidBills[tid];
    if(!bill) return;
    bill.items.splice(idx,1);
    if(bill.items.length===0) { delete unpaidBills[tid]; const t = tables.find(t=>t.id===tid); if(t) t.occupied=false; saveDataToStorage(); loadTables(); closeModal('paymentModal'); showToast('Bill cleared','info'); return; }
    bill.amount = bill.items.reduce((s,i)=>s + i.price*i.quantity,0);
    document.getElementById('paymentTotal').textContent = `₹${bill.amount.toFixed(2)}`;
    const container = document.getElementById('billItemsList');
    container.innerHTML = bill.items.map((item,i)=>`<div style="display:flex; justify-content:space-between; padding:5px 0;"><span>${item.name}</span><span><button onclick="editBillItemQuantity(${tid},${i},'dec')">-</button> ${item.quantity} <button onclick="editBillItemQuantity(${tid},${i},'inc')">+</button></span><span>₹${(item.price*item.quantity).toFixed(2)}</span><button onclick="removeBillItem(${tid},${i})">✕</button></div>`).join('');
    saveDataToStorage();
}

function confirmPayment(tid) {
    const bill = unpaidBills[tid];
    if(!bill) return;
    const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash';
    pendingPayments[tid] = { amount: bill.amount, items: [...bill.items], timestamp: bill.timestamp, paymentMethod: method, settled: false };
    printFinalBill(tid, pendingPayments[tid]);
    delete unpaidBills[tid];
    if(tableOrders[tid]) delete tableOrders[tid];
    if(newOrderItems[tid]) delete newOrderItems[tid];
    saveDataToStorage(); updateSalesSummary(); loadTables();
    closeModal('paymentModal');
    showToast(`Bill printed! Amount to collect: ₹${bill.amount.toFixed(2)}`, 'success');
}

function saveOrder() {
    const tid = parseInt(document.getElementById('tableNumber').textContent);
    if(!tableOrders[tid] || !tableOrders[tid].items.length) return showToast('No items','warning');
    const table = tables.find(t=>t.id===tid);
    if(table) table.occupied = true;
    saveDataToStorage(); closeModal('tableOrderModal'); loadTables(); showToast('Order saved','success');
}

function clearOrder() {
    const tid = parseInt(document.getElementById('tableNumber').textContent);
    if(!tableOrders[tid]) return;
    if(confirm('Clear all items?')) { delete tableOrders[tid]; const t=tables.find(t=>t.id===tid); if(t) t.occupied=false; saveDataToStorage(); manageTable(tid); showToast('Order cleared','info'); }
}

// ========== DELIVERY ORDERS ==========
function showNewDeliveryModal() {
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('deliveryAddress').value = '';
    document.getElementById('deliveryOrderItems').innerHTML = '';
    document.getElementById('deliveryTotal').textContent = '₹0.00';
    const catCont = document.querySelector('#newDeliveryModal .menu-categories');
    catCont.innerHTML = '';
    categories.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category-item';
        el.textContent = cat.name;
        el.onclick = () => {
            document.querySelectorAll('#newDeliveryModal .category-item').forEach(c=>c.classList.remove('active'));
            el.classList.add('active');
            currentCategoryId['newDeliveryModal'] = cat.id;
            loadMenuItems(cat.id, 'newDeliveryModal');
        };
        catCont.appendChild(el);
    });
    if(categories.length) {
        const saved = currentCategoryId['newDeliveryModal'];
        const toLoad = saved ? Array.from(catCont.children).find(c=>c.textContent === categories.find(cat=>cat.id===saved)?.name) : null;
        if(toLoad) toLoad.click(); else catCont.firstChild?.click();
    }
    document.getElementById('newDeliveryModal').style.display = 'block';
}

function addItemToDeliveryOrder(item) {
    const cont = document.getElementById('deliveryOrderItems');
    const existing = Array.from(cont.children).find(el => el.dataset.itemId == item.id);
    if(existing) {
        const qtySpan = existing.querySelector('.order-item-quantity');
        const priceSpan = existing.querySelector('.order-item-price');
        let q = parseInt(qtySpan.textContent.substring(1));
        q++;
        qtySpan.textContent = `x${q}`;
        priceSpan.textContent = `₹${(item.price * q).toFixed(2)}`;
    } else {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.dataset.itemId = item.id;
        div.innerHTML = `<div class="order-item-name">${item.name}</div><div class="order-item-quantity">x1</div><div class="order-item-price">₹${item.price.toFixed(2)}</div><div class="order-item-remove" onclick="removeDeliveryOrderItem(this)">✕</div>`;
        cont.appendChild(div);
    }
    updateDeliveryOrderTotal();
    showToast(`${item.name} added`, 'success');
}

function removeDeliveryOrderItem(el) {
    const orderItem = el.parentElement;
    const qtySpan = orderItem.querySelector('.order-item-quantity');
    let q = parseInt(qtySpan.textContent.substring(1));
    if(q > 1) {
        q--;
        qtySpan.textContent = `x${q}`;
        const priceSpan = orderItem.querySelector('.order-item-price');
        const itemPrice = parseFloat(priceSpan.textContent.substring(1)) / (q+1);
        priceSpan.textContent = `₹${(itemPrice * q).toFixed(2)}`;
    } else orderItem.remove();
    updateDeliveryOrderTotal();
    showToast('Item removed','info');
}

function updateDeliveryOrderTotal() {
    let total = 0;
    document.querySelectorAll('#deliveryOrderItems .order-item').forEach(item => {
        const price = parseFloat(item.querySelector('.order-item-price').textContent.substring(1));
        total += price;
    });
    document.getElementById('deliveryTotal').textContent = `₹${total.toFixed(2)}`;
}

function saveDeliveryOrder() {
    const name = document.getElementById('customerName').value || 'Guest';
    const phone = document.getElementById('customerPhone').value || 'N/A';
    const addr = document.getElementById('deliveryAddress').value || 'N/A';
    const items = [];
    document.querySelectorAll('#deliveryOrderItems .order-item').forEach(el => {
        const id = parseInt(el.dataset.itemId);
        const mi = menuItems.find(m=>m.id===id);
        if(mi) {
            const qty = parseInt(el.querySelector('.order-item-quantity').textContent.substring(1));
            items.push({ id: mi.id, name: mi.name, price: mi.price, quantity: qty });
        }
    });
    if(!items.length) return showToast('Add items','warning');
    const newId = deliveryOrders.length ? Math.max(...deliveryOrders.map(o=>o.id))+1 : 1;
    deliveryOrders.push({ id: newId, type: 'delivery', customerName: name, customerPhone: phone, deliveryAddress: addr, items, timestamp: new Date().toISOString() });
    saveDataToStorage(); loadDeliveryOrders(); closeModal('newDeliveryModal'); showToast('Delivery saved','success');
}

function loadDeliveryOrders() {
    const container = document.getElementById('deliveryOrdersList');
    container.innerHTML = '';
    deliveryOrders.forEach(order => {
        const total = order.items.reduce((s,i)=>s + i.price*i.quantity,0);
        const card = document.createElement('div');
        card.className = 'delivery-order-card';
        card.innerHTML = `<div class="delivery-order-info"><h3>${order.customerName}</h3><p>${order.customerPhone}</p><p>${order.deliveryAddress}</p><p>Total: ₹${total.toFixed(2)}</p></div><div class="delivery-order-actions"><button onclick="printDeliveryKOT(${order.id})">KOT</button><button onclick="printDeliveryBill(${order.id})">Bill</button><button class="complete" onclick="completeDeliveryOrder(${order.id})">Complete</button></div>`;
        container.appendChild(card);
    });
    if(!deliveryOrders.length) container.innerHTML = '<p>No delivery orders</p>';
}

function printDeliveryKOT(orderId) {
    const order = deliveryOrders.find(o=>o.id===orderId);
    if(!order) return;
    const content = `<html><head><title>Delivery KOT</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h3{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .item-row{display:flex;justify-content:space-between;margin:2px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h3>DELIVERY KOT</h3><div class="separator-line"></div></div><p><strong>Customer:</strong> ${order.customerName}</p><p><strong>Phone:</strong> ${order.customerPhone}</p><p><strong>Address:</strong> ${order.deliveryAddress}</p><div class="separator-line"></div>${order.items.map(i=>`<div class="item-row"><span>${i.name}</span><span>x${i.quantity}</span></div>`).join('')}<div class="separator-line"></div><div class="center"><p>--- DELIVERY KOT ---</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(content); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
    setTimeout(()=>printDeliveryBill(orderId),1000);
    showToast('KOT printed','success');
}

function printDeliveryBill(orderId) {
    const order = deliveryOrders.find(o=>o.id===orderId);
    if(!order) return;
    const total = order.items.reduce((s,i)=>s + i.price*i.quantity,0);
    const pending = { id: orderId, type: 'delivery', customerName: order.customerName, customerPhone: order.customerPhone, deliveryAddress: order.deliveryAddress, items: [...order.items], amount: total, timestamp: new Date().toISOString(), settled: false };
    pendingDeliveryOrders.push(pending);
    const rName = localStorage.getItem('restaurantName') || 'Restaurant';
    const rAdd = localStorage.getItem('restaurantAddress') || '';
    const rPhone = localStorage.getItem('restaurantPhone') || '';
    const gst = localStorage.getItem('restaurantGST') || '';
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const curr = restaurants.find(r=>r.id===localStorage.getItem('currentRestaurantId'));
    const finalGST = curr?.gst || gst;
    const rPhone2 = curr?.phone2 || '';
    const billContent = `<html><head><title>Delivery Bill</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h2{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .bill-header{display:flex;justify-content:space-between;font-size:14px;} .bill-item{margin:2px 0;} .grand-total{font-size:18px;text-align:center;margin:4px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h2>${rName}</h2>${rAdd?`<p>${rAdd}</p>`:''}${rPhone?`<p>Ph: ${rPhone}${rPhone2?` / ${rPhone2}`:''}</p>`:''}${finalGST?`<p>GST: ${finalGST}</p>`:''}<div class="separator-line"></div></div><p><strong>DELIVERY ORDER</strong></p><p>Customer: ${order.customerName}</p><p>Phone: ${order.customerPhone}</p><p>Address: ${order.deliveryAddress}</p><p>Date: ${new Date().toLocaleString()}</p><div class="separator-line"></div><div class="bill-header"><span>Item</span><span>Qty Price Amount</span></div><div class="separator-line"></div>${order.items.map(i=>`<div class="bill-item"><div class="item-name">${i.name}</div><div class="item-details" style="text-align:right">${i.quantity} ${i.price.toFixed(2)} ${(i.price*i.quantity).toFixed(2)}</div></div>`).join('')}<div class="separator-line"></div><div class="grand-total">Total: ₹${total.toFixed(2)}</div><div class="separator-line"></div><div class="center"><p>Thank You, Visit Again!</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(billContent); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
    deliveryOrders = deliveryOrders.filter(o=>o.id!==orderId);
    saveDataToStorage(); loadDeliveryOrders(); loadPendingDeliveryOrders();
    showToast(`Bill printed! Amount to collect: ₹${total.toFixed(2)}`, 'success');
}

function completeDeliveryOrder(orderId) {
    const idx = deliveryOrders.findIndex(o=>o.id===orderId);
    if(idx===-1) return;
    const order = deliveryOrders[idx];
    const total = order.items.reduce((s,i)=>s + i.price*i.quantity,0);
    daySales.deliveryOrders++; daySales.totalSales += total;
    deliveryOrders.splice(idx,1);
    saveDataToStorage(); updateSalesSummary(); loadDeliveryOrders(); loadPickupOrders();
    showToast('Delivery completed','success');
}

function printDeliveryKOTAndBill() {
    const name = document.getElementById('customerName').value || 'Guest';
    const phone = document.getElementById('customerPhone').value || 'N/A';
    const addr = document.getElementById('deliveryAddress').value || 'N/A';
    const items = [];
    document.querySelectorAll('#deliveryOrderItems .order-item').forEach(el => {
        const id = parseInt(el.dataset.itemId);
        const mi = menuItems.find(m=>m.id===id);
        if(mi) {
            const qty = parseInt(el.querySelector('.order-item-quantity').textContent.substring(1));
            items.push({ id: mi.id, name: mi.name, price: mi.price, quantity: qty });
        }
    });
    if(!items.length) return showToast('Add items','warning');
    const newId = deliveryOrders.length ? Math.max(...deliveryOrders.map(o=>o.id))+1 : 1;
    deliveryOrders.push({ id: newId, type: 'delivery', customerName: name, customerPhone: phone, deliveryAddress: addr, items, timestamp: new Date().toISOString() });
    saveDataToStorage();
    printDeliveryKOT(newId);
    loadDeliveryOrders(); closeModal('newDeliveryModal');
    showToast('Order placed','success');
}

// ========== PENDING DELIVERY ==========
function loadPendingDeliveryOrders() {
    const container = document.getElementById('pendingDeliveryOrdersList');
    if(!container) return;
    container.innerHTML = '';
    if(pendingDeliveryOrders.length===0) { container.innerHTML = '<p>No pending delivery orders</p>'; return; }
    pendingDeliveryOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'delivery-order-card pending';
        card.style.borderLeft = '4px solid #f59e0b';
        card.innerHTML = `<div class="delivery-order-info"><h3>${order.customerName}</h3><p>${order.customerPhone} | ${order.deliveryAddress}</p><p>Total: ₹${order.amount.toFixed(2)}</p><p style="color:#f59e0b;">⏳ Payment Pending</p></div><div class="delivery-order-actions"><button onclick="editPendingDeliveryOrder(${order.id})">✏️ Edit Order</button><button onclick="reprintDeliveryBillFromPending(${order.id})">🖨️ Reprint Bill</button><button class="complete" onclick="settleDeliveryOrder(${order.id})">✅ Settle & Complete</button></div>`;
        container.appendChild(card);
    });
}

function editPendingDeliveryOrder(orderId) {
    const order = pendingDeliveryOrders.find(o=>o.id===orderId);
    if(!order) return;
    currentPendingOrder = order; currentPendingOrderType = 'delivery';
    const modalHtml = `
    <div id="editPendingOrderModal" class="modal" style="display:block;">
        <div class="modal-content large-modal">
            <div class="modal-header"><h2>Edit Delivery Order - ${order.customerName}</h2><span class="close-modal" onclick="closeModal('editPendingOrderModal')">&times;</span></div>
            <div class="modal-body">
                <div class="order-container">
                    <div class="menu-categories" id="editPendingMenuCategories"></div>
                    <div style="flex:1;"><div class="search-container"><input type="text" id="editPendingMenuSearch" placeholder="🔍 Search..." onkeyup="searchEditPendingMenuItems()" style="width:100%; padding:10px;"></div><div class="menu-items-container" id="editPendingMenuItems"></div></div>
                    <div class="order-summary"><h3>Order Summary</h3><div class="order-items" id="editPendingOrderItems">${order.items.map((item,idx)=>`<div class="order-item"><div class="order-item-name">${item.name}</div><div class="order-item-quantity">x${item.quantity}</div><div class="order-item-price">₹${(item.price*item.quantity).toFixed(2)}</div><div class="order-item-remove" onclick="removeFromEditPendingOrder(${idx})">✕</div></div>`).join('')}</div><div class="order-total"><div>Total: <span id="editPendingOrderTotal">₹${order.amount.toFixed(2)}</span></div></div><div class="order-actions"><button onclick="saveEditPendingOrder()">Save Changes & Reprint Bill</button><button onclick="closeModal('editPendingOrderModal')">Cancel</button></div></div>
                </div>
            </div>
        </div>
    </div>`;
    const existing = document.getElementById('editPendingOrderModal');
    if(existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const catCont = document.getElementById('editPendingMenuCategories');
    categories.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category-item';
        el.textContent = cat.name;
        el.onclick = () => {
            document.querySelectorAll('#editPendingMenuCategories .category-item').forEach(c=>c.classList.remove('active'));
            el.classList.add('active');
            loadEditPendingMenuItems(cat.id);
        };
        catCont.appendChild(el);
    });
    if(categories.length) catCont.firstChild?.click();
}

function loadEditPendingMenuItems(catId) {
    const cont = document.getElementById('editPendingMenuItems');
    if(!cont) return;
    cont.innerHTML = '';
    const items = menuItems.filter(i=>i.categoryId===catId);
    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'menu-item';
        el.innerHTML = `<h4>${item.name}</h4><p>₹${item.price.toFixed(2)}</p>`;
        el.onclick = () => addToEditPendingOrder(item);
        cont.appendChild(el);
    });
}

function searchEditPendingMenuItems() {
    const term = document.getElementById('editPendingMenuSearch').value.toLowerCase();
    const cont = document.getElementById('editPendingMenuItems');
    if(!term) { const active = document.querySelector('#editPendingMenuCategories .category-item.active'); if(active) loadEditPendingMenuItems(categories.find(c=>c.name===active.textContent)?.id); return; }
    const results = menuItems.filter(i=>i.name.toLowerCase().includes(term));
    cont.innerHTML = '';
    results.forEach(item => {
        const el = document.createElement('div');
        el.className = 'menu-item';
        el.innerHTML = `<h4>${item.name}</h4><p>₹${item.price.toFixed(2)}</p><small>${categories.find(c=>c.id===item.categoryId)?.name}</small>`;
        el.onclick = () => addToEditPendingOrder(item);
        cont.appendChild(el);
    });
}

function addToEditPendingOrder(item) {
    if(!currentPendingOrder) return;
    const existing = currentPendingOrder.items.find(i=>i.id===item.id);
    if(existing) existing.quantity++;
    else currentPendingOrder.items.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    currentPendingOrder.amount = currentPendingOrder.items.reduce((s,i)=>s + i.price*i.quantity,0);
    const orderDiv = document.getElementById('editPendingOrderItems');
    orderDiv.innerHTML = currentPendingOrder.items.map((item,idx)=>`<div class="order-item"><div class="order-item-name">${item.name}</div><div class="order-item-quantity">x${item.quantity}</div><div class="order-item-price">₹${(item.price*item.quantity).toFixed(2)}</div><div class="order-item-remove" onclick="removeFromEditPendingOrder(${idx})">✕</div></div>`).join('');
    document.getElementById('editPendingOrderTotal').textContent = `₹${currentPendingOrder.amount.toFixed(2)}`;
}

function removeFromEditPendingOrder(idx) {
    if(!currentPendingOrder) return;
    currentPendingOrder.items.splice(idx,1);
    if(currentPendingOrder.items.length===0) { currentPendingOrder.amount = 0; }
    else currentPendingOrder.amount = currentPendingOrder.items.reduce((s,i)=>s + i.price*i.quantity,0);
    const orderDiv = document.getElementById('editPendingOrderItems');
    orderDiv.innerHTML = currentPendingOrder.items.map((item,idx2)=>`<div class="order-item"><div class="order-item-name">${item.name}</div><div class="order-item-quantity">x${item.quantity}</div><div class="order-item-price">₹${(item.price*item.quantity).toFixed(2)}</div><div class="order-item-remove" onclick="removeFromEditPendingOrder(${idx2})">✕</div></div>`).join('');
    document.getElementById('editPendingOrderTotal').textContent = `₹${currentPendingOrder.amount.toFixed(2)}`;
}

function saveEditPendingOrder() {
    if(!currentPendingOrder) return;
    const idx = pendingDeliveryOrders.findIndex(o=>o.id===currentPendingOrder.id);
    if(idx!==-1) pendingDeliveryOrders[idx] = currentPendingOrder;
    saveDataToStorage();
    reprintDeliveryBillFromPending(currentPendingOrder.id);
    loadPendingDeliveryOrders();
    closeModal('editPendingOrderModal');
    showToast('Order updated & bill reprinted','success');
}

function reprintDeliveryBillFromPending(orderId) {
    const order = pendingDeliveryOrders.find(o=>o.id===orderId);
    if(!order) return;
    const rName = localStorage.getItem('restaurantName') || 'Restaurant';
    const rAdd = localStorage.getItem('restaurantAddress') || '';
    const rPhone = localStorage.getItem('restaurantPhone') || '';
    const gst = localStorage.getItem('restaurantGST') || '';
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const curr = restaurants.find(r=>r.id===localStorage.getItem('currentRestaurantId'));
    const finalGST = curr?.gst || gst;
    const rPhone2 = curr?.phone2 || '';
    const content = `<html><head><title>Delivery Bill</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h2{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .bill-header{display:flex;justify-content:space-between;font-size:14px;} .bill-item{margin:2px 0;} .grand-total{font-size:18px;text-align:center;margin:4px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h2>${rName}</h2>${rAdd?`<p>${rAdd}</p>`:''}${rPhone?`<p>Ph: ${rPhone}${rPhone2?` / ${rPhone2}`:''}</p>`:''}${finalGST?`<p>GST: ${finalGST}</p>`:''}<div class="separator-line"></div></div><p><strong>DELIVERY ORDER</strong></p><p>Customer: ${order.customerName}</p><p>Phone: ${order.customerPhone}</p><p>Address: ${order.deliveryAddress}</p><p>Date: ${new Date().toLocaleString()}</p><div class="separator-line"></div><div class="bill-header"><span>Item</span><span>Qty Price Amount</span></div><div class="separator-line"></div>${order.items.map(i=>`<div class="bill-item"><div class="item-name">${i.name}</div><div class="item-details" style="text-align:right">${i.quantity} ${i.price.toFixed(2)} ${(i.price*i.quantity).toFixed(2)}</div></div>`).join('')}<div class="separator-line"></div><div class="grand-total">Total: ₹${order.amount.toFixed(2)}</div><div class="separator-line"></div><div class="center"><p>Thank You, Visit Again!</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(content); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
}

function settleDeliveryOrder(orderId) {
    const idx = pendingDeliveryOrders.findIndex(o=>o.id===orderId);
    if(idx===-1) return;
    const order = pendingDeliveryOrders[idx];
    daySales.deliveryOrders += 1;
    daySales.totalSales += order.amount;
    if(!orderHistory[`delivery_${orderId}`]) orderHistory[`delivery_${orderId}`] = [];
    orderHistory[`delivery_${orderId}`].unshift({ orderId, amount: order.amount, items: order.items, timestamp: order.timestamp, paymentMethod: 'Cash' });
    pendingDeliveryOrders.splice(idx,1);
    saveDataToStorage(); updateSalesSummary(); loadPendingDeliveryOrders();
    showToast(`Delivery order settled! Amount: ₹${order.amount.toFixed(2)}`, 'success');
}

// ========== PICKUP ORDERS ==========
function showNewPickupModal() {
    document.getElementById('pickupCustomerName').value = '';
    document.getElementById('pickupCustomerPhone').value = '';
    document.getElementById('pickupOrderItems').innerHTML = '';
    document.getElementById('pickupTotal').textContent = '₹0.00';
    const catCont = document.querySelector('#newPickupModal .menu-categories');
    catCont.innerHTML = '';
    categories.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category-item';
        el.textContent = cat.name;
        el.onclick = () => {
            document.querySelectorAll('#newPickupModal .category-item').forEach(c=>c.classList.remove('active'));
            el.classList.add('active');
            currentCategoryId['newPickupModal'] = cat.id;
            loadMenuItems(cat.id, 'newPickupModal');
        };
        catCont.appendChild(el);
    });
    if(categories.length) {
        const saved = currentCategoryId['newPickupModal'];
        const toLoad = saved ? Array.from(catCont.children).find(c=>c.textContent === categories.find(cat=>cat.id===saved)?.name) : null;
        if(toLoad) toLoad.click(); else catCont.firstChild?.click();
    }
    document.getElementById('newPickupModal').style.display = 'block';
}

function addItemToPickupOrder(item) {
    const cont = document.getElementById('pickupOrderItems');
    const existing = Array.from(cont.children).find(el => el.dataset.itemId == item.id);
    if(existing) {
        const qtySpan = existing.querySelector('.order-item-quantity');
        const priceSpan = existing.querySelector('.order-item-price');
        let q = parseInt(qtySpan.textContent.substring(1));
        q++;
        qtySpan.textContent = `x${q}`;
        priceSpan.textContent = `₹${(item.price * q).toFixed(2)}`;
    } else {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.dataset.itemId = item.id;
        div.innerHTML = `<div class="order-item-name">${item.name}</div><div class="order-item-quantity">x1</div><div class="order-item-price">₹${item.price.toFixed(2)}</div><div class="order-item-remove" onclick="removePickupOrderItem(this)">✕</div>`;
        cont.appendChild(div);
    }
    updatePickupOrderTotal();
    showToast(`${item.name} added`, 'success');
}

function removePickupOrderItem(el) {
    const orderItem = el.parentElement;
    const qtySpan = orderItem.querySelector('.order-item-quantity');
    let q = parseInt(qtySpan.textContent.substring(1));
    if(q > 1) {
        q--;
        qtySpan.textContent = `x${q}`;
        const priceSpan = orderItem.querySelector('.order-item-price');
        const itemPrice = parseFloat(priceSpan.textContent.substring(1)) / (q+1);
        priceSpan.textContent = `₹${(itemPrice * q).toFixed(2)}`;
    } else orderItem.remove();
    updatePickupOrderTotal();
    showToast('Item removed','info');
}

function updatePickupOrderTotal() {
    let total = 0;
    document.querySelectorAll('#pickupOrderItems .order-item').forEach(item => {
        const price = parseFloat(item.querySelector('.order-item-price').textContent.substring(1));
        total += price;
    });
    document.getElementById('pickupTotal').textContent = `₹${total.toFixed(2)}`;
}

function savePickupOrder() {
    const name = document.getElementById('pickupCustomerName').value || 'Walk-in Customer';
    const phone = document.getElementById('pickupCustomerPhone').value || '';
    const items = [];
    document.querySelectorAll('#pickupOrderItems .order-item').forEach(el => {
        const id = parseInt(el.dataset.itemId);
        const mi = menuItems.find(m=>m.id===id);
        if(mi) {
            const qty = parseInt(el.querySelector('.order-item-quantity').textContent.substring(1));
            items.push({ id: mi.id, name: mi.name, price: mi.price, quantity: qty });
        }
    });
    if(!items.length) return showToast('Add items','warning');
    const newId = pickupOrders.length ? Math.max(...pickupOrders.map(o=>o.id))+1 : 1;
    pickupOrders.push({ id: newId, type: 'pickup', customerName: name, customerPhone: phone, items, timestamp: new Date().toISOString(), status: 'pending' });
    saveDataToStorage(); loadPickupOrders(); closeModal('newPickupModal'); showToast('Pickup saved','success');
}

function loadPickupOrders() {
    const container = document.getElementById('pickupOrdersList');
    container.innerHTML = '';
    pickupOrders.forEach(order => {
        const total = order.items.reduce((s,i)=>s + i.price*i.quantity,0);
        const card = document.createElement('div');
        card.className = 'delivery-order-card';
        card.innerHTML = `<div class="delivery-order-info"><h3>${order.customerName}</h3><p>${order.customerPhone || 'No phone'}</p><p>Total: ₹${total.toFixed(2)}</p></div><div class="delivery-order-actions"><button onclick="printPickupKOT(${order.id})">KOT</button><button onclick="printPickupBill(${order.id})">Bill</button><button class="complete" onclick="completePickupOrder(${order.id})">Complete</button></div>`;
        container.appendChild(card);
    });
    if(!pickupOrders.length) container.innerHTML = '<p>No pickup orders</p>';
}

function printPickupKOT(orderId) {
    const order = pickupOrders.find(o=>o.id===orderId);
    if(!order) return;
    const content = `<html><head><title>Pickup KOT</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h3{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .item-row{display:flex;justify-content:space-between;margin:2px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h3>PICKUP KOT</h3><div class="separator-line"></div></div><p><strong>Customer:</strong> ${order.customerName}</p>${order.customerPhone?`<p><strong>Phone:</strong> ${order.customerPhone}</p>`:''}<div class="separator-line"></div>${order.items.map(i=>`<div class="item-row"><span>${i.name}</span><span>x${i.quantity}</span></div>`).join('')}<div class="separator-line"></div><div class="center"><p>--- PICKUP KOT ---</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(content); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
    setTimeout(()=>printPickupBill(orderId),1000);
    showToast('KOT printed','success');
}

function printPickupBill(orderId) {
    const order = pickupOrders.find(o=>o.id===orderId);
    if(!order) return;
    const total = order.items.reduce((s,i)=>s + i.price*i.quantity,0);
    const pending = { id: orderId, type: 'pickup', customerName: order.customerName, customerPhone: order.customerPhone, items: [...order.items], amount: total, timestamp: new Date().toISOString(), settled: false };
    pendingPickupOrders.push(pending);
    const rName = localStorage.getItem('restaurantName') || 'Restaurant';
    const rAdd = localStorage.getItem('restaurantAddress') || '';
    const rPhone = localStorage.getItem('restaurantPhone') || '';
    const gst = localStorage.getItem('restaurantGST') || '';
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const curr = restaurants.find(r=>r.id===localStorage.getItem('currentRestaurantId'));
    const finalGST = curr?.gst || gst;
    const rPhone2 = curr?.phone2 || '';
    const billContent = `<html><head><title>Pickup Bill</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h2{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .bill-header{display:flex;justify-content:space-between;font-size:14px;} .bill-item{margin:2px 0;} .grand-total{font-size:18px;text-align:center;margin:4px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h2>${rName}</h2>${rAdd?`<p>${rAdd}</p>`:''}${rPhone?`<p>Ph: ${rPhone}${rPhone2?` / ${rPhone2}`:''}</p>`:''}${finalGST?`<p>GST: ${finalGST}</p>`:''}<div class="separator-line"></div></div><p><strong>PICKUP ORDER</strong></p><p>Customer: ${order.customerName}</p>${order.customerPhone?`<p>Phone: ${order.customerPhone}</p>`:''}<p>Date: ${new Date().toLocaleString()}</p><div class="separator-line"></div><div class="bill-header"><span>Item</span><span>Qty Price Amount</span></div><div class="separator-line"></div>${order.items.map(i=>`<div class="bill-item"><div class="item-name">${i.name}</div><div class="item-details" style="text-align:right">${i.quantity} ${i.price.toFixed(2)} ${(i.price*i.quantity).toFixed(2)}</div></div>`).join('')}<div class="separator-line"></div><div class="grand-total">Total: ₹${total.toFixed(2)}</div><div class="separator-line"></div><div class="center"><p>Thank You! Please come again.</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(billContent); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
    pickupOrders = pickupOrders.filter(o=>o.id!==orderId);
    saveDataToStorage(); loadPickupOrders(); loadPendingPickupOrders();
    showToast(`Bill printed! Amount to collect: ₹${total.toFixed(2)}`, 'success');
}

function completePickupOrder(orderId) {
    const idx = pickupOrders.findIndex(o=>o.id===orderId);
    if(idx===-1) return;
    const order = pickupOrders[idx];
    const total = order.items.reduce((s,i)=>s + i.price*i.quantity,0);
    daySales.pickupOrders++; daySales.totalSales += total;
    pickupOrders.splice(idx,1);
    saveDataToStorage(); updateSalesSummary(); loadPickupOrders(); loadDeliveryOrders();
    showToast('Pickup completed','success');
}

function printPickupKOTAndBill() {
    const name = document.getElementById('pickupCustomerName').value || 'Walk-in Customer';
    const phone = document.getElementById('pickupCustomerPhone').value || '';
    const items = [];
    document.querySelectorAll('#pickupOrderItems .order-item').forEach(el => {
        const id = parseInt(el.dataset.itemId);
        const mi = menuItems.find(m=>m.id===id);
        if(mi) {
            const qty = parseInt(el.querySelector('.order-item-quantity').textContent.substring(1));
            items.push({ id: mi.id, name: mi.name, price: mi.price, quantity: qty });
        }
    });
    if(!items.length) return showToast('Add items','warning');
    const newId = pickupOrders.length ? Math.max(...pickupOrders.map(o=>o.id))+1 : 1;
    pickupOrders.push({ id: newId, type: 'pickup', customerName: name, customerPhone: phone, items, timestamp: new Date().toISOString(), status: 'pending' });
    saveDataToStorage();
    printPickupKOT(newId);
    loadPickupOrders(); closeModal('newPickupModal');
    showToast('Pickup placed','success');
}

// ========== PENDING PICKUP ==========
function loadPendingPickupOrders() {
    const container = document.getElementById('pendingPickupOrdersList');
    if(!container) return;
    container.innerHTML = '';
    if(pendingPickupOrders.length===0) { container.innerHTML = '<p>No pending pickup orders</p>'; return; }
    pendingPickupOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = 'delivery-order-card pending';
        card.style.borderLeft = '4px solid #f59e0b';
        card.innerHTML = `<div class="delivery-order-info"><h3>${order.customerName}</h3><p>${order.customerPhone || 'No phone'}</p><p>Total: ₹${order.amount.toFixed(2)}</p><p style="color:#f59e0b;">⏳ Payment Pending</p></div><div class="delivery-order-actions"><button onclick="editPendingPickupOrder(${order.id})">✏️ Edit Order</button><button onclick="reprintPickupBillFromPending(${order.id})">🖨️ Reprint Bill</button><button class="complete" onclick="settlePickupOrder(${order.id})">✅ Settle & Complete</button></div>`;
        container.appendChild(card);
    });
}

function editPendingPickupOrder(orderId) {
    const order = pendingPickupOrders.find(o=>o.id===orderId);
    if(!order) return;
    currentPendingOrder = order; currentPendingOrderType = 'pickup';
    const modalHtml = `
    <div id="editPendingOrderModal" class="modal" style="display:block;">
        <div class="modal-content large-modal">
            <div class="modal-header"><h2>Edit Pickup Order - ${order.customerName}</h2><span class="close-modal" onclick="closeModal('editPendingOrderModal')">&times;</span></div>
            <div class="modal-body">
                <div class="order-container">
                    <div class="menu-categories" id="editPendingMenuCategories"></div>
                    <div style="flex:1;"><div class="search-container"><input type="text" id="editPendingMenuSearch" placeholder="🔍 Search..." onkeyup="searchEditPendingMenuItems()" style="width:100%; padding:10px;"></div><div class="menu-items-container" id="editPendingMenuItems"></div></div>
                    <div class="order-summary"><h3>Order Summary</h3><div class="order-items" id="editPendingOrderItems">${order.items.map((item,idx)=>`<div class="order-item"><div class="order-item-name">${item.name}</div><div class="order-item-quantity">x${item.quantity}</div><div class="order-item-price">₹${(item.price*item.quantity).toFixed(2)}</div><div class="order-item-remove" onclick="removeFromEditPendingOrder(${idx})">✕</div></div>`).join('')}</div><div class="order-total"><div>Total: <span id="editPendingOrderTotal">₹${order.amount.toFixed(2)}</span></div></div><div class="order-actions"><button onclick="saveEditPendingPickupOrder()">Save Changes & Reprint Bill</button><button onclick="closeModal('editPendingOrderModal')">Cancel</button></div></div>
                </div>
            </div>
        </div>
    </div>`;
    const existing = document.getElementById('editPendingOrderModal');
    if(existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const catCont = document.getElementById('editPendingMenuCategories');
    categories.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category-item';
        el.textContent = cat.name;
        el.onclick = () => {
            document.querySelectorAll('#editPendingMenuCategories .category-item').forEach(c=>c.classList.remove('active'));
            el.classList.add('active');
            loadEditPendingMenuItems(cat.id);
        };
        catCont.appendChild(el);
    });
    if(categories.length) catCont.firstChild?.click();
}

function saveEditPendingPickupOrder() {
    if(!currentPendingOrder) return;
    const idx = pendingPickupOrders.findIndex(o=>o.id===currentPendingOrder.id);
    if(idx!==-1) pendingPickupOrders[idx] = currentPendingOrder;
    saveDataToStorage();
    reprintPickupBillFromPending(currentPendingOrder.id);
    loadPendingPickupOrders();
    closeModal('editPendingOrderModal');
    showToast('Order updated & bill reprinted','success');
}

function reprintPickupBillFromPending(orderId) {
    const order = pendingPickupOrders.find(o=>o.id===orderId);
    if(!order) return;
    const rName = localStorage.getItem('restaurantName') || 'Restaurant';
    const rAdd = localStorage.getItem('restaurantAddress') || '';
    const rPhone = localStorage.getItem('restaurantPhone') || '';
    const gst = localStorage.getItem('restaurantGST') || '';
    const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
    const curr = restaurants.find(r=>r.id===localStorage.getItem('currentRestaurantId'));
    const finalGST = curr?.gst || gst;
    const rPhone2 = curr?.phone2 || '';
    const content = `<html><head><title>Pickup Bill</title><style>body{font-family:'Courier New',monospace;font-size:16px;margin:0;padding:0;font-weight:900;} h2{font-size:18px;} .separator-line{border-top:2px solid #000;margin:2px 0;} .bill-header{display:flex;justify-content:space-between;font-size:14px;} .bill-item{margin:2px 0;} .grand-total{font-size:18px;text-align:center;margin:4px 0;} .center{text-align:center;} @media print{@page{margin:0;} body{margin:0;padding:0;}}</style></head><body><div class="center"><h2>${rName}</h2>${rAdd?`<p>${rAdd}</p>`:''}${rPhone?`<p>Ph: ${rPhone}${rPhone2?` / ${rPhone2}`:''}</p>`:''}${finalGST?`<p>GST: ${finalGST}</p>`:''}<div class="separator-line"></div></div><p><strong>PICKUP ORDER</strong></p><p>Customer: ${order.customerName}</p>${order.customerPhone?`<p>Phone: ${order.customerPhone}</p>`:''}<p>Date: ${new Date().toLocaleString()}</p><div class="separator-line"></div><div class="bill-header"><span>Item</span><span>Qty Price Amount</span></div><div class="separator-line"></div>${order.items.map(i=>`<div class="bill-item"><div class="item-name">${i.name}</div><div class="item-details" style="text-align:right">${i.quantity} ${i.price.toFixed(2)} ${(i.price*i.quantity).toFixed(2)}</div></div>`).join('')}<div class="separator-line"></div><div class="grand-total">Total: ₹${order.amount.toFixed(2)}</div><div class="separator-line"></div><div class="center"><p>Thank You! Please come again.</p></div></body></html>`;
    const ifr = document.createElement('iframe'); ifr.style.display='none'; document.body.appendChild(ifr);
    ifr.contentDocument.write(content); ifr.contentDocument.close();
    ifr.onload = ()=>{setTimeout(()=>{ifr.contentWindow.print(); setTimeout(()=>ifr.remove(),1000);},100);};
}

function settlePickupOrder(orderId) {
    const idx = pendingPickupOrders.findIndex(o=>o.id===orderId);
    if(idx===-1) return;
    const order = pendingPickupOrders[idx];
    daySales.pickupOrders += 1;
    daySales.totalSales += order.amount;
    if(!orderHistory[`pickup_${orderId}`]) orderHistory[`pickup_${orderId}`] = [];
    orderHistory[`pickup_${orderId}`].unshift({ orderId, amount: order.amount, items: order.items, timestamp: order.timestamp, paymentMethod: 'Cash' });
    pendingPickupOrders.splice(idx,1);
    saveDataToStorage(); updateSalesSummary(); loadPendingPickupOrders();
    showToast(`Pickup order settled! Amount: ₹${order.amount.toFixed(2)}`, 'success');
}

// ========== ORDER HISTORY ==========
function loadOrderHistory() {
    const container = document.getElementById('orderHistoryList');
    if(!container) return;
    container.innerHTML = '';
    const allTables = [...new Set([...Object.keys(orderHistory), ...Object.keys(orderHistory).filter(k=>k.startsWith('delivery_')||k.startsWith('pickup_')).map(k=>k.split('_')[1])])];
    const sorted = allTables.sort((a,b)=>Number(a)-Number(b));
    if(sorted.length===0) { container.innerHTML = '<p>No history</p>'; return; }
    for(const tableId of sorted) {
        const orders = [];
        for(const key in orderHistory) {
            if(key === tableId || key === `delivery_${tableId}` || key === `pickup_${tableId}`) orders.push(...orderHistory[key]);
        }
        if(orders.length) {
            const div = document.createElement('div');
            div.style.cssText = 'margin-bottom:30px; background:white; border-radius:12px; padding:20px';
            div.innerHTML = `<h3>Table ${tableId}</h3><div>${orders.slice(0,5).map((o,i)=>`<div style="margin-bottom:15px; padding:15px; background:#f9fafb; border-left:4px solid #10b981;"><div><strong>Order #${o.orderId||i+1}</strong> <span>${new Date(o.timestamp).toLocaleString()}</span></div>${o.items.map(it=>`<div>${it.name} x${it.quantity} = ₹${(it.price*it.quantity).toFixed(2)}</div>`).join('')}<div><strong>Total: ₹${o.amount.toFixed(2)}</strong></div><div>Payment: ${o.paymentMethod||'Cash'}</div></div>`).join('')}</div>`;
            if(orders.length>5) div.innerHTML += `<p>+ ${orders.length-5} more</p>`;
            container.appendChild(div);
        }
    }
}

// ========== OPERATIONS ==========
function loadCategories() {
    const container = document.getElementById('categoriesList');
    container.innerHTML = '';
    categories.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'category-item';
        el.innerHTML = `<span class="category-name">${cat.name}</span><div class="category-actions"><span onclick="editCategory(${cat.id})">✎</span><span onclick="deleteCategory(${cat.id})">✕</span></div>`;
        el.onclick = (e) => {
            if(e.target.tagName==='SPAN' && e.target.parentElement.classList.contains('category-actions')) return;
            document.querySelectorAll('#categoriesList .category-item').forEach(c=>c.classList.remove('active'));
            el.classList.add('active');
            const menuCont = document.getElementById('menuItems');
            menuCont.innerHTML = '';
            const items = menuItems.filter(i=>i.categoryId===cat.id);
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'menu-item-card';
                card.innerHTML = `<div class="item-header"><h3>${item.name}</h3><div class="item-actions"><button onclick="editMenuItem(${item.id})">Edit</button><button onclick="deleteMenuItem(${item.id})" class="delete">Delete</button></div></div><p>₹${item.price.toFixed(2)}</p>`;
                menuCont.appendChild(card);
            });
            if(!items.length) menuCont.innerHTML = '<p>No items. <button onclick="showAddItemModal()">Add Item</button></p>';
        };
        container.appendChild(el);
    });
    if(categories.length) container.firstChild?.click();
}

function showAddCategoryModal() {
    document.getElementById('categoryName').value = '';
    document.getElementById('addCategoryModal').style.display = 'block';
}

function addCategory() {
    const name = document.getElementById('categoryName').value;
    if(!name) return alert('Enter name');
    const newId = categories.length ? Math.max(...categories.map(c=>c.id))+1 : 1;
    categories.push({ id: newId, name });
    saveDataToStorage(); loadCategories(); closeModal('addCategoryModal'); showToast('Category added','success');
}

function editCategory(id) {
    const cat = categories.find(c=>c.id===id);
    if(!cat) return;
    const newName = prompt('New category name:', cat.name);
    if(newName && newName.trim()) { cat.name = newName.trim(); saveDataToStorage(); loadCategories(); showToast('Category updated','success'); }
}

function deleteCategory(id) {
    const cat = categories.find(c=>c.id===id);
    if(!cat) return;
    const itemCount = menuItems.filter(i=>i.categoryId===id).length;
    if(confirm(`Delete "${cat.name}"? ${itemCount?`(will delete ${itemCount} items)` : ''}`)) {
        menuItems = menuItems.filter(i=>i.categoryId!==id);
        categories = categories.filter(c=>c.id!==id);
        saveDataToStorage(); loadCategories(); showToast('Category deleted','info');
    }
}

function showAddItemModal() {
    const sel = document.getElementById('itemCategory');
    sel.innerHTML = '';
    categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat.id; opt.textContent = cat.name; sel.appendChild(opt); });
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('addItemModal').style.display = 'block';
}

function addMenuItem() {
    const cat = parseInt(document.getElementById('itemCategory').value);
    const name = document.getElementById('itemName').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    if(!cat || !name || isNaN(price) || price<=0) return alert('Invalid');
    const newId = menuItems.length ? Math.max(...menuItems.map(i=>i.id))+1 : 1;
    menuItems.push({ id: newId, categoryId: cat, name, price });
    saveDataToStorage(); loadCategories(); closeModal('addItemModal'); showToast('Item added','success');
}

function editMenuItem(id) {
    const item = menuItems.find(i=>i.id===id);
    if(!item) return;
    const sel = document.getElementById('editItemCategory');
    sel.innerHTML = '';
    categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat.id; opt.textContent = cat.name; if(cat.id===item.categoryId) opt.selected=true; sel.appendChild(opt); });
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemPrice').value = item.price;
    document.getElementById('editItemModal').dataset.itemId = id;
    document.getElementById('editItemModal').style.display = 'block';
}

function saveEditMenuItem() {
    const id = parseInt(document.getElementById('editItemModal').dataset.itemId);
    const item = menuItems.find(i=>i.id===id);
    if(!item) return;
    const cat = parseInt(document.getElementById('editItemCategory').value);
    const name = document.getElementById('editItemName').value;
    const price = parseFloat(document.getElementById('editItemPrice').value);
    if(!cat || !name || isNaN(price) || price<=0) return alert('Invalid');
    item.categoryId = cat; item.name = name; item.price = price;
    saveDataToStorage(); loadCategories(); closeModal('editItemModal'); showToast('Item updated','success');
}

function deleteMenuItem(id) {
    if(confirm('Delete this item?')) { menuItems = menuItems.filter(i=>i.id!==id); saveDataToStorage(); loadCategories(); showToast('Item deleted','info'); }
}

// ========== SALES & TABLE MANAGEMENT ==========
function updateCurrentDate() {
    const el = document.getElementById('currentDate');
    if(el) el.textContent = `Date: ${daySales.date}`;
}

function updateSalesSummary() {
    const el = document.getElementById('salesSummary');
    if(el) el.innerHTML = `<div class="sales-card"><h3>Table Orders</h3><p>${daySales.tableOrders}</p></div><div class="sales-card"><h3>Delivery Orders</h3><p>${daySales.deliveryOrders}</p></div><div class="sales-card"><h3>Pickup Orders</h3><p>${daySales.pickupOrders}</p></div><div class="sales-card"><h3>Total Sales</h3><p>₹${daySales.totalSales.toFixed(2)}</p></div>`;
}

function printDaySummary() {
    const name = localStorage.getItem('restaurantName') || 'Restaurant';
    alert(`${name}\nDaily Sales Summary\nDate: ${daySales.date}\n------------------------------\nTable Orders: ${daySales.tableOrders}\nDelivery Orders: ${daySales.deliveryOrders}\nPickup Orders: ${daySales.pickupOrders}\nTotal Sales: ₹${daySales.totalSales.toFixed(2)}\n------------------------------`);
}

function resetDaySalesConfirm() {
    if(confirm('Reset all sales for today?')) { resetDaySales(); showToast('Day sales reset','success'); }
}

function showTableManagementModal() {
    document.getElementById('tableCount').value = tables.length;
    document.getElementById('tableManagementModal').style.display = 'block';
}

function addTable() {
    const newId = tables.length ? Math.max(...tables.map(t=>t.id))+1 : 1;
    tables.push({ id: newId, name: `Table ${newId}`, occupied: false });
    document.getElementById('tableCount').value = tables.length;
    saveDataToStorage(); loadTables(); showToast(`Table ${newId} added`,'success');
}

function removeTable() {
    if(tables.length<=1) return alert('At least one table required');
    const last = tables[tables.length-1];
    if(last.occupied || pendingPayments[last.id] || unpaidBills[last.id]) return alert(`Table ${last.id} has pending order`);
    if(confirm(`Remove Table ${last.id}?`)) { tables.pop(); document.getElementById('tableCount').value = tables.length; saveDataToStorage(); loadTables(); showToast(`Table ${last.id} removed`,'info'); }
}

function saveTableChanges() {
    saveDataToStorage(); loadTables(); closeModal('tableManagementModal'); showToast('Table config saved','success');
}

function printAllBills() { showToast('Coming soon','info'); }

function loadMenuItems(categoryId, modalId) {
    const container = document.querySelector(`#${modalId} .menu-items-container`);
    if(!container) return;
    container.innerHTML = '';
    const items = menuItems.filter(i=>i.categoryId===categoryId);
    if(items.length===0) { container.innerHTML = '<div style="padding:40px; text-align:center;">No items</div>'; return; }
    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'menu-item';
        el.innerHTML = `<h4>${item.name}</h4><p>₹${item.price.toFixed(2)}</p>`;
        el.onclick = () => {
            if(modalId === 'tableOrderModal') {
                const tid = parseInt(document.getElementById('tableNumber').textContent);
                if(unpaidBills[tid] && !unpaidBills[tid].paid) addItemToExistingBill(tid, item);
                else addItemToOrder(item);
            } else if(modalId === 'newDeliveryModal') addItemToDeliveryOrder(item);
            else if(modalId === 'newPickupModal') addItemToPickupOrder(item);
        };
        container.appendChild(el);
    });
}

// Initialize
function initializeApp() {
    loadDataFromStorage();
    const name = localStorage.getItem('restaurantName');
    if(!name) document.getElementById('restaurantSetupModal').style.display = 'block';
    else {
        document.getElementById('sidebarRestaurantName').textContent = name;
        const addr = localStorage.getItem('restaurantAddress') || '';
        const phone = localStorage.getItem('restaurantPhone') || '';
        const gst = localStorage.getItem('restaurantGST') || '';
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const curr = restaurants.find(r=>r.id===localStorage.getItem('currentRestaurantId'));
        restaurantInfo = { name, address: addr, phone, phone2: curr?.phone2||'', gst: curr?.gst||gst };
        securityQuestion = localStorage.getItem('securityQuestion') || '';
        securityAnswer = localStorage.getItem('securityAnswer') || '';
        const hasSQ = localStorage.getItem('securityQuestion');
        const sideBtn = document.getElementById('sidebarSetupSecurityBtn');
        if(sideBtn) sideBtn.style.display = hasSQ ? 'none' : 'block';
        loadTables(); loadCategories(); loadDeliveryOrders(); loadPickupOrders(); loadPendingDeliveryOrders(); loadPendingPickupOrders(); loadOrderHistory(); updateCurrentDate(); updateSalesSummary();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);