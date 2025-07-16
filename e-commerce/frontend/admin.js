document.addEventListener("DOMContentLoaded", function () {
  // Login check and redirect
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  // Sidebar Toggle
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  const mainContent = document.querySelector(".admin-main");
  const header = document.querySelector(".admin-header");

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("active");
      mainContent.classList.toggle("sidebar-collapsed");
      header.classList.toggle("sidebar-collapsed");
    });
  }

  // Submenu Toggle
  const submenuBtn = document.querySelector(".submenu-btn");
  if (submenuBtn) {
    submenuBtn.addEventListener("click", function () {
      const submenuParent = this.closest(".has-submenu");
      submenuParent.classList.toggle("active");
    });
  }

  // Set active state based on current page
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll(".sidebar-nav a").forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
      const submenuParent = link.closest(".has-submenu");
      if (submenuParent) {
        submenuParent.classList.add("active");
      }
    }
  });

  // Refresh Button Animation
  document.querySelectorAll(".refresh-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      this.querySelector("i").classList.add("fa-spin");
      setTimeout(() => {
        this.querySelector("i").classList.remove("fa-spin");
      }, 1000);
    });
  });

  // Load Recent Orders from API
  async function loadRecentOrders() {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/recent-orders/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const orders = await res.json();
      const tbody = document.querySelector('.orders-table tbody');
      if (tbody) {
        tbody.innerHTML = orders.map(order => `
          <tr>
            <td>#ORD-${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.product}</td>
            <td>${order.date}</td>
            <td>$${order.amount}</td>
            <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  }

  // Load Recent Buyers from API
  async function loadRecentBuyers() {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/recent-buyers/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const buyers = await res.json();
      const buyersTable = document.querySelector('.buyers-table');
      if (buyersTable) {
        buyersTable.innerHTML = buyers.map(buyer => `
          <div class="buyer-row">
            <div class="buyer-info">
              <img src="${buyer.avatar || 'images/avatar1.png'}" alt="Buyer Avatar">
              <div class="buyer-details">
                <h4>${buyer.name}</h4>
                <span class="buyer-tag">${buyer.category}</span>
              </div>
            </div>
            <div class="buyer-amount">$${buyer.amount}</div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Failed to load buyers', err);
    }
  }

  // Initial load
  loadRecentOrders();
  loadRecentBuyers();
});
