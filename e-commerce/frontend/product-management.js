// Product Management
class ProductManager {
    constructor() {
        // Only initialize on products page
        if (window.location.pathname.includes('admin-products.html')) {
            this.storageKey = 'shoehub_products'; // Unique storage key
            this.products = JSON.parse(localStorage.getItem(this.storageKey)) || [];
            this.initializeEventListeners();
        }
    }

    initializeEventListeners() {
        const addProductBtn = document.getElementById("addProductBtn");
        const closeModalBtn = document.getElementById("closeModal");
        const cancelAddBtn = document.getElementById("cancelAdd");
        const addProductForm = document.getElementById("addProductForm");

        if (addProductBtn) {
            addProductBtn.addEventListener("click", () => this.openAddProductModal());
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener("click", () => this.closeModal());
        }

        if (cancelAddBtn) {
            cancelAddBtn.addEventListener("click", () => this.closeModal());
        }

        if (addProductForm) {
            addProductForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleProductSave(addProductForm);
            });
        }

        // Load products if on products page
        if (document.querySelector(".products-table")) {
            this.loadProducts();
        }
    }

    openAddProductModal() {
        const modal = document.getElementById("addProductModal");
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    closeModal() {
        const modal = document.getElementById("addProductModal");
        if (modal) {
            modal.classList.remove("active");
            document.body.style.overflow = "";
            const form = document.getElementById("addProductForm");
            if (form) form.reset();
        }
    }

    handleProductSave(form) {
        // First check form validity
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        
        // Validate required fields with correct field names
        const requiredFields = ['productName', 'productCategory', 'productPrice', 'productStock', 'productDescription'];
        let hasEmptyFields = false;
        
        requiredFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                hasEmptyFields = true;
                showFlashMessage(`Please fill in ${field.replace('product', '')} field`, 'error');
            }
        });

        if (hasEmptyFields) return;

        const imageFile = formData.get('productImage');
        if (!imageFile || imageFile.size === 0) {
            showFlashMessage('Please select a product image', 'error');
            return;
        }

        const productData = {
            id: "#PRD-" + Math.floor(1000 + Math.random() * 9000),
            name: formData.get("productName"),
            category: formData.get("productCategory"),
            price: formData.get("productPrice"),
            stock: formData.get("productStock"),
            description: formData.get("productDescription")
        };

        // Handle image upload
        const reader = new FileReader();
        reader.onload = (e) => {
            productData.image = e.target.result;
            this.saveProduct(productData);
        };
        reader.readAsDataURL(imageFile);
    }

    saveProduct(productData) {
        // Validate product data before saving
        if (!productData.name || !productData.category || !productData.price) {
            showFlashMessage('Please fill in all required fields', 'error');
            return;
        }

        // Only save if we're on the products page
        if (window.location.pathname.includes('admin-products.html')) {
            try {
                this.products.push(productData);
                localStorage.setItem(this.storageKey, JSON.stringify(this.products));
                this.loadProducts();
                this.updateProductCount();
                this.closeModal();
               // showFlashMessage('Product added successfully!', 'success');
            } catch (error) {
                console.error('Error saving product:', error);
                showFlashMessage('Failed to save product', 'error');
            }
        }
    }

    loadProducts() {
        const tbody = document.querySelector(".products-table tbody");
        if (tbody) {
            tbody.innerHTML = '';
            this.products.forEach(product => {
                const newRow = document.createElement("tr");
                newRow.innerHTML = `
                    <td>${product.id}</td>
                    <td><img src="${product.image}" alt="${product.name}"></td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price}</td>
                    <td>${product.stock}</td>
                    <td><span class="status active">Active</span></td>
                    <td>
                        <button class="action-btn" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="action-btn" title="Edit Product"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete" title="Delete Product"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(newRow);
            });
        }
    }

    updateProductCount() {
        // Only update count if we're on the products page
        if (window.location.pathname.includes('admin-products.html')) {
            const productCountElement = document.querySelector(".stat-card.products .stat-number");
            if (productCountElement) {
                productCountElement.textContent = `+${this.products.length}`;
            }
        }
    }

    deleteProduct(productId) {
        // Only delete if we're on the products page
        if (window.location.pathname.includes('admin-products.html')) {
            if (confirm('Are you sure you want to delete this product?')) {
                this.products = this.products.filter(product => product.id !== productId);
                localStorage.setItem(this.storageKey, JSON.stringify(this.products));
                this.loadProducts();
                this.updateProductCount();
            }
        }
    }
}

// Initialize product manager only on the products page
if (window.location.pathname.includes('admin-products.html')) {
    const productManager = new ProductManager();

    // Handle delete product
    document.addEventListener('click', function(e) {
        if (e.target.closest('.action-btn.delete')) {
            const button = e.target.closest('.action-btn.delete');
            const productId = button.dataset.id;
            productManager.deleteProduct(productId);
        }
    });
}