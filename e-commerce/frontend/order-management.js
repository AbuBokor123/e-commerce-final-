// Order Management
class OrderManager {
    constructor() {
        // Only initialize on orders page
        if (window.location.pathname.includes('orders.html')) {
            this.storageKey = 'shoehub_orders'; // Unique storage key
            this.orders = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            this.initializeEventListeners();
        }
    }

    initializeEventListeners() {
        // Load orders if on orders page
        if (document.querySelector(".orders-table")) {
            this.loadOrders();
        }
    }

    loadOrders() {
        const tbody = document.querySelector(".orders-table tbody");
        if (tbody) {
            tbody.innerHTML = '';
            this.orders.forEach(order => {
                const newRow = document.createElement("tr");
                newRow.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${order.date}</td>
                    <td>$${order.total}</td>
                    <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
                    <td>${order.payment}</td>
                    <td>
                        <button class="action-btn" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="action-btn" title="Edit Order"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" title="Delete Order"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(newRow);
            });
        }
    }

    saveOrder(orderData) {
        // Only save if we're on the orders page
        if (window.location.pathname.includes('orders.html')) {
            this.orders.push(orderData);
            localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
            this.loadOrders();
            this.updateOrderCount();
        }
    }

    updateOrderCount() {
        // Only update count if we're on the orders page
        if (window.location.pathname.includes('orders.html')) {
            const orderCountElement = document.querySelector(".stat-card.orders .stat-number");
            if (orderCountElement) {
                orderCountElement.textContent = `+${this.orders.length}`;
            }
        }
    }

    deleteOrder(orderId) {
        // Only delete if we're on the orders page
        if (window.location.pathname.includes('orders.html')) {
            if (confirm('Are you sure you want to delete this order?')) {
                this.orders = this.orders.filter(order => order.id !== orderId);
                localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
                this.loadOrders();
                this.updateOrderCount();
            }
        }
    }
}

// Initialize order manager only on the orders page
if (window.location.pathname.includes('orders.html')) {
    const orderManager = new OrderManager();

    // Handle delete order
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn.delete')) {
            const button = e.target.closest('.action-btn.delete');
            const orderId = button.dataset.id;
            orderManager.deleteOrder(orderId);
        }
    });
} 