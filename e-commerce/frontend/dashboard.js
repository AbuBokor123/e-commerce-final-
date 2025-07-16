// Dashboard State Management
const dashboardState = {
    user: {
        name: 'Guest User',
        email: 'guest@example.com',
        phone: '‪+1 234 567 8900‬',
        profileImage: 'images/user-1.png',
        isPremium: false
    },
    orders: [
        {
            id: '12345',
            date: '2024-03-15',
            items: [
                {
                    name: 'Nike Sports Shoes',
                    image: 'images/product-1.jpg',
                    size: '10',
                    color: 'Black',
                    quantity: 1,
                    price: 120.00
                } 
            ],
            status: 'delivered',
            total: 120.00
        },
        {
            id: '12344',
            date: '2024-03-10',
            items: [
                {
                    name: 'Adidas Running Shoes',
                    image: 'images/product-2.jpg',
                    size: '9',
                    color: 'White',
                    quantity: 1,
                    price: 100.00
                }
            ],
            status: 'processing',
            total: 100.00
        }
    ],
    wishlist: [
        {
            id: 1,
            name: 'Nike Sports Shoes',
            price: 120.00,
            image: 'images/product-1.jpg',
            inStock: true,
            onSale: false
        },
        {
            id: 2,
            name: 'Adidas Running Shoes',
            price: 100.00,
            image: 'images/product-2.jpg',
            inStock: true,
            onSale: true
        }
    ],
    addresses: [
        {
            id: 1,
            type: 'Home',
            isDefault: true,
            street: 'Sahi Eid Gah',
            city: 'Sylhet',
            country: 'Bangladesh',
            coordinates: [24.8949, 91.8687]
        }
    ],
    paymentMethods: [
        {
            id: 1,
            type: 'VISA',
            last4: '1234',
            expiry: '12/25'
        }
    ],
    activityLog: [
        {
            type: 'order',
            description: 'Order Placed',
            details: 'You placed order #12345',
            timestamp: '2 hours ago'
        },
        {
            type: 'profile',
            description: 'Profile Updated',
            details: 'You updated your profile information',
            timestamp: '1 day ago'
        }
    ],
    stats: {
        totalOrders: 12,
        wishlistItems: 8,
        totalSpent: 1250.00
    }
};

// Dashboard UI Management
class DashboardUI {
    constructor() {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            window.location.href = 'account.html';
            return;
        }

        this.initializeEventListeners();
        this.loadUserData();
        this.updateDashboardStats();
        this.renderOrders();
        this.renderWishlist();
        this.renderAddresses();
        this.renderPaymentMethods();
        this.renderActivityLog();
    }

    initializeEventListeners() {
        // Tab Navigation
        document.querySelectorAll('.dashboard-menu li').forEach(item => {
            item.addEventListener('click', () => this.switchTab(item.dataset.tab));
        });

        // Profile Image Change
        document.querySelector('.change-profile-btn').addEventListener('click', () => this.handleProfileImageChange());

        // Form Submissions
        document.querySelector('.settings-form')?.addEventListener('submit', (e) => this.handleSettingsSubmit(e));

        // Order Filters
        document.querySelector('.order-filters .filter-select')?.addEventListener('change', (e) => this.filterOrders(e.target.value));

        // Wishlist Actions
        document.querySelector('.wishlist-items')?.addEventListener('click', (e) => this.handleWishlistAction(e));

        // Address Actions
        document.querySelector('.addresses-list')?.addEventListener('click', (e) => this.handleAddressAction(e));

        // Payment Method Actions
        document.querySelector('.payment-methods')?.addEventListener('click', (e) => this.handlePaymentAction(e));
    }

    switchTab(tabId) {
        // Remove active class from all tabs
        document.querySelectorAll('.dashboard-menu li').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.dashboard-tab').forEach(tab => tab.classList.remove('active'));

        // Add active class to selected tab
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');

        // Update content based on tab
        this.updateTabContent(tabId);
    }

    updateTabContent(tabId) {
        switch(tabId) {
            case 'overview':
                this.updateDashboardStats();
                break;
            case 'orders':
                this.renderOrders();
                break;
            case 'wishlist':
                this.renderWishlist();
                break;
            case 'addresses':
                this.renderAddresses();
                break;
            case 'payments':
                this.renderPaymentMethods();
                break;
            case 'activity':
                this.renderActivityLog();
                break;
        }
    }

    loadUserData() {
        // Get user data from localStorage or session
        const userData = JSON.parse(localStorage.getItem('userData')) || {
            name: 'Guest User',
            email: 'guest@example.com',
            profileImage: 'images/user-1.png',
            isPremium: false
        };

        // Update the UI with user data
        document.querySelector('.user-profile h3').textContent = userData.name;
        document.querySelector('.user-profile p').textContent = userData.email;
        document.querySelector('.profile-image').src = userData.profileImage;
        
        // Update premium status
        const statusBadge = document.querySelector('.status-badge');
        if (userData.isPremium) {
            statusBadge.textContent = 'Premium Member';
            statusBadge.style.display = 'inline-block';
        } else {
            statusBadge.style.display = 'none';
        }
    }

    updateDashboardStats() {
        const { stats } = dashboardState;
        
        // Update stats in the UI
        document.querySelectorAll('.stat-info').forEach(statElement => {
            const statType = statElement.querySelector('h3').textContent.toLowerCase().replace(' ', '');
            
            if (stats[statType] !== undefined) {
                const valueElement = statElement.querySelector('p');
                if (statType === 'totalspent') {
                    valueElement.textContent = `$${stats[statType].toFixed(2)}`;
                } else {
                    valueElement.textContent = stats[statType];
                }
            }
        });
    }

    renderOrders(orders = dashboardState.orders) {
        const ordersList = document.querySelector('.orders-list');
        if (!ordersList) return;
        
        ordersList.innerHTML = orders.map(order => `
            <div class="order-card" data-id="${order.id}">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${order.date}</span>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${item.image}" alt="${item.name}" />
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <p>Size: ${item.size}, Color: ${item.color}</p>
                                <p>Quantity: ${item.quantity}</p>
                            </div>
                            <div class="item-price">$${item.price.toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                    <div class="order-actions">
                        <button class="btn btn-sm">Track Order</button>
                        <button class="btn btn-sm">View Details</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderWishlist() {
        const wishlistItems = document.querySelector('.wishlist-items');
        if (!wishlistItems) return;
        
        wishlistItems.innerHTML = dashboardState.wishlist.map(item => `
            <div class="wishlist-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" />
                <div class="wishlist-details">
                    <h4>${item.name}</h4>
                    <p class="price">$${item.price.toFixed(2)}</p>
                    <p class="stock-status ${item.inStock ? 'in-stock' : 'out-of-stock'}">
                        ${item.inStock ? 'In Stock' : 'Out of Stock'}
                    </p>
                    ${item.onSale ? '<span class="sale-badge">On Sale</span>' : ''}
                </div>
                <div class="wishlist-actions">
                    <button class="btn btn-sm">Add to Cart</button>
                    <button class="btn btn-sm btn-danger">Remove</button>
                </div>
            </div>
        `).join('');
    }

    renderAddresses() {
        const addressesList = document.querySelector('.addresses-list');
        if (!addressesList) return;
        
        addressesList.innerHTML = dashboardState.addresses.map(address => `
            <div class="address-card" data-id="${address.id}">
                <div class="address-header">
                    <h4>${address.type} Address</h4>
                    ${address.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                <p>${address.street}</p>
                <p>${address.city}</p>
                <p>${address.country}</p>
                <div class="address-map" id="map-${address.id}"></div>
                <div class="address-actions">
                    <button class="btn btn-sm">Edit</button>
                    <button class="btn btn-sm btn-danger">Delete</button>
                </div>
            </div>
        `).join('');

        // Initialize maps for each address
        dashboardState.addresses.forEach(address => {
            const mapElement = document.getElementById(`map-${address.id}`);
            if (mapElement && !mapElement._map) {
                const map = L.map(mapElement).setView(address.coordinates, 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                L.marker(address.coordinates).addTo(map);
                mapElement._map = map; // Store reference to prevent reinitialization
            }
        });
    }

    renderPaymentMethods() {
        const paymentMethods = document.querySelector('.payment-methods');
        if (!paymentMethods) return;
        
        paymentMethods.innerHTML = dashboardState.paymentMethods.map(method => `
            <div class="payment-card" data-id="${method.id}">
                <div class="card-preview">
                    <div class="card-type">${method.type}</div>
                    <div class="card-number">•••• •••• •••• ${method.last4}</div>
                    <div class="card-expiry">Expires: ${method.expiry}</div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-sm">Edit</button>
                    <button class="btn btn-sm btn-danger">Remove</button>
                </div>
            </div>
        `).join('');
    }

    renderActivityLog() {
        const activityTimeline = document.querySelector('.activity-timeline');
        if (!activityTimeline) return;
        
        activityTimeline.innerHTML = dashboardState.activityLog.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fa fa-${activity.type === 'order' ? 'shopping-bag' : 'user'}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.description}</h4>
                    <p>${activity.details}</p>
                    <span class="activity-time">${activity.timestamp}</span>
                </div>
            </div>
        `).join('');
    }

    handleProfileImageChange() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // Update the profile image
                    const profileImage = document.querySelector('.profile-image');
                    profileImage.src = event.target.result;
                    
                    // Save to localStorage
                    const userData = JSON.parse(localStorage.getItem('userData')) || {};
                    userData.profileImage = event.target.result;
                    localStorage.setItem('userData', JSON.stringify(userData));
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    handleSettingsSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        dashboardState.user = {
            ...dashboardState.user,
            name: formData.get('name') || dashboardState.user.name,
            email: formData.get('email') || dashboardState.user.email,
            phone: formData.get('phone') || dashboardState.user.phone
        };
        this.loadUserData();
        alert('Settings saved successfully!');
    }

    filterOrders(status) {
        const filteredOrders = status === 'All Orders' 
            ? dashboardState.orders 
            : dashboardState.orders.filter(order => order.status === status.toLowerCase());
        this.renderOrders(filteredOrders);
    }

    handleWishlistAction(e) {
        if (e.target.classList.contains('btn-danger')) {
            const item = e.target.closest('.wishlist-item');
            const itemId = parseInt(item.dataset.id);
            dashboardState.wishlist = dashboardState.wishlist.filter(i => i.id !== itemId);
            this.renderWishlist();
            this.updateDashboardStats();
        }
    }

    handleAddressAction(e) {
        if (e.target.classList.contains('btn-danger')) {
            const address = e.target.closest('.address-card');
            const addressId = parseInt(address.dataset.id);
            dashboardState.addresses = dashboardState.addresses.filter(a => a.id !== addressId);
            this.renderAddresses();
            this.updateDashboardStats();
        }
    }

    handlePaymentAction(e) {
        if (e.target.classList.contains('btn-danger')) {
            const card = e.target.closest('.payment-card');
            const cardId = parseInt(card.dataset.id);
            dashboardState.paymentMethods = dashboardState.paymentMethods.filter(p => p.id !== cardId);
            this.renderPaymentMethods();
            this.updateDashboardStats();
        }
    }
}

// Initialize Dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardUI();
});
