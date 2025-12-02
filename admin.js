// admin.js - Enhanced with better error handling and real-time updates
class AdminDashboard {
    constructor() {
        this.orders = [];
        this.products = [];
        this.customers = [];
        this.currentUser = null;
        this.baseURL = 'http://localhost:5000';
        this.currentProductImage = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Admin Dashboard...');
        this.setupEventListeners();
        this.checkAuth();
        this.startAutoRefresh(); // Auto-refresh data every 30 seconds
    }

    startAutoRefresh() {
        // Auto-refresh data every 30 seconds
        setInterval(() => {
            if (this.currentUser) {
                this.loadDashboardData();
            }
        }, 30000);
    }

    setupEventListeners() {
        // Admin login
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Tab navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

        // Refresh data
        const refreshBtn = document.getElementById('refresh-data');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData();
            });
        }

        // Order filter
        const orderFilter = document.getElementById('order-status-filter');
        if (orderFilter) {
            orderFilter.addEventListener('change', () => {
                this.displayOrders();
            });
        }

        // Add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showProductModal();
            });
        }

        // Product modal
        this.setupProductModal();
        
        // Image upload handling
        this.setupImageUpload();
    }

    setupImageUpload() {
        const imageFileInput = document.getElementById('product-image-file');
        const uploadBtn = document.querySelector('.btn-upload');
        const previewImg = document.getElementById('image-preview');
        const imageUrlInput = document.getElementById('product-image-url');

        if (uploadBtn && imageFileInput) {
            uploadBtn.addEventListener('click', () => {
                imageFileInput.click();
            });

            imageFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (!file.type.startsWith('image/')) {
                        this.showNotification('Please select an image file', 'error');
                        return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                        this.showNotification('Image must be less than 5MB', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.currentProductImage = event.target.result; // Store as base64
                        previewImg.src = event.target.result;
                        previewImg.style.display = 'block';
                        imageUrlInput.value = ''; // Clear URL input
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (imageUrlInput) {
            imageUrlInput.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                if (url) {
                    this.currentProductImage = url;
                    if (previewImg) {
                        previewImg.src = url;
                        previewImg.style.display = 'block';
                    }
                    // Clear file input if URL is entered
                    if (imageFileInput) {
                        imageFileInput.value = '';
                    }
                }
            });
        }
    }

    setupProductModal() {
        const modal = document.getElementById('product-modal');
        const closeBtn = document.getElementById('close-product-modal');
        const cancelBtn = document.getElementById('cancel-product');
        const form = document.getElementById('product-form');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideProductModal();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideProductModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideProductModal();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }
    }

    async handleAdminLogin() {
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        if (username === 'admin' && password === 'admin123') {
            this.currentUser = { name: 'Administrator', role: 'admin' };
            localStorage.setItem('adminUser', JSON.stringify(this.currentUser));
            this.showDashboard();
            this.showNotification('Login successful!', 'success');
        } else {
            this.showNotification('Invalid credentials! Use admin/admin123', 'error');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('adminUser');
        this.showLogin();
        this.showNotification('Logged out successfully', 'info');
    }

    checkAuth() {
        const savedAdmin = localStorage.getItem('adminUser');
        if (savedAdmin) {
            this.currentUser = JSON.parse(savedAdmin);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        this.loadDashboardData();
    }

    switchTab(tabName) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeMenuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
        }

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        const activeTab = document.getElementById(`tab-${tabName}`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        switch(tabName) {
            case 'orders':
                this.loadOrders();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
        }
    }

    async loadDashboardData() {
        this.showLoading();
        
        try {
            await Promise.all([
                this.loadOrders(),
                this.loadProducts(),
                this.loadCustomers()
            ]);
            this.updateStats();
            this.showNotification('Dashboard data loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadOrders() {
        try {
            console.log('📦 Loading orders from backend...');
            const response = await fetch(`${this.baseURL}/api/admin/orders`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Orders response:', data);
            
            if (data.success) {
                this.orders = data.orders || [];
                this.displayOrders();
                this.updateOrderStats();
                this.updatePendingBadge();
            } else {
                throw new Error(data.message || 'Failed to load orders');
            }
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            this.showNotification('Failed to load orders. Check if server is running.', 'error');
            this.orders = [];
            this.displayOrders();
        }
    }

    displayOrders() {
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;

        const statusFilter = document.getElementById('order-status-filter').value;
        const filteredOrders = statusFilter === 'all' 
            ? this.orders 
            : this.orders.filter(order => order.status === statusFilter);

        if (filteredOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem;">
                        <div class="no-orders">
                            <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc;"></i>
                            <p>No ${statusFilter === 'all' ? '' : statusFilter} orders found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredOrders.map(order => {
            const items = order.items || [];
            const itemsSummary = items.length > 0 
                ? `${items[0].product}${items.length > 1 ? ` +${items.length - 1} more` : ''}`
                : 'No items';

            return `
            <tr>
                <td><strong>${order.orderNumber || order.id}</strong></td>
                <td>
                    <strong>${order.customerName || 'Unknown Customer'}</strong><br>
                    <small>${order.customerPhone || 'No phone'}</small><br>
                    <small class="text-muted">${itemsSummary}</small>
                </td>
                <td>${new Date(order.date).toLocaleDateString()}</td>
                <td><strong>ksh ${parseFloat(order.total || 0).toFixed(2)}</strong></td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${this.formatOrderStatus(order.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon view-btn" onclick="admin.viewOrderDetails('${order.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                            <div class="status-buttons">
                                <button class="status-btn preparing" onclick="admin.updateOrderStatus('${order.id}', 'preparing')" title="Mark as Preparing">
                                    <i class="fas fa-utensils"></i>
                                </button>
                                <button class="status-btn ready" onclick="admin.updateOrderStatus('${order.id}', 'ready')" title="Mark as Ready">
                                    <i class="fas fa-box"></i>
                                </button>
                                <button class="status-btn completed" onclick="admin.updateOrderStatus('${order.id}', 'completed')" title="Mark as Completed">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    }

    async updateOrderStatus(orderId, newStatus) {
        const statusMessages = {
            'preparing': 'Mark as Preparing',
            'ready': 'Mark as Ready for Pickup', 
            'completed': 'Mark as Completed'
        };

        if (!confirm(`${statusMessages[newStatus]}?`)) return;
        
        try {
            const response = await fetch(`${this.baseURL}/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Order ${newStatus === 'completed' ? 'completed' : 'updated'} successfully!`, 'success');
                await this.loadOrders();
                await this.loadDashboardData();
            } else {
                throw new Error(data.message || 'Failed to update order');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            this.showNotification('Failed to update order status', 'error');
        }
    }

    updateOrderStats() {
        const stats = {
            pending: this.orders.filter(o => o.status === 'pending').length,
            confirmed: this.orders.filter(o => o.status === 'confirmed').length,
            preparing: this.orders.filter(o => o.status === 'preparing').length,
            ready: this.orders.filter(o => o.status === 'ready').length,
            completed: this.orders.filter(o => o.status === 'completed').length
        };

        Object.entries(stats).forEach(([status, count]) => {
            const element = document.getElementById(`${status}-count`);
            if (element) element.textContent = count;
        });
    }

    updatePendingBadge() {
        const pendingCount = this.orders.filter(o => 
            o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
        ).length;
        const badge = document.getElementById('pending-orders-badge');
        if (badge) {
            badge.textContent = pendingCount;
            badge.style.display = pendingCount > 0 ? 'flex' : 'none';
        }
    }

    async loadProducts() {
        try {
            console.log('📦 Loading products from backend...');
            const response = await fetch(`${this.baseURL}/api/products`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Products response:', data);
            
            if (data.success) {
                this.products = data.products || [];
                this.displayProducts();
            } else {
                throw new Error(data.message || 'Failed to load products');
            }
        } catch (error) {
            console.error('❌ Error loading products:', error);
            this.showNotification('Failed to load products', 'error');
            this.products = [];
            this.displayProducts();
        }
    }

    displayProducts() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <p>No products found</p>
                        <button class="btn btn-primary" onclick="admin.showProductModal()">
                            <i class="fas fa-plus"></i> Add First Product
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.products.map(product => `
            <tr>
                <td>
                    <img src="${this.getProductImageUrl(product.image)}" class="product-image-cell" 
                         onerror="this.src='https://via.placeholder.com/80/fff9c4/ff6f00?text=🍋'">
                </td>
                <td>
                    <strong>${product.name}</strong><br>
                    <small>${product.description || 'No description'}</small>
                </td>
                <td>${this.formatCategory(product.category)}</td>
                <td><strong>ksh ${product.price.toFixed(2)}</strong></td>
                <td>
                    <span class="stock-indicator stock-${this.getStockLevel(product.stock)}">
                        ${product.stock} units
                    </span>
                </td>
                <td><span class="status-badge status-${product.status}">${product.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="admin.editProduct(${product.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="admin.deleteProduct(${product.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getProductImageUrl(image) {
        if (!image) {
            return 'https://via.placeholder.com/80/fff9c4/ff6f00?text=🍋';
        }
        
        // If it's a base64 image, use it directly
        if (image.startsWith('data:image')) {
            return image;
        }
        
        // If it's a relative path, make it absolute
        if (image.startsWith('/')) {
            return `${this.baseURL}${image}`;
        }
        
        // If it's already a full URL or placeholder, use it as is
        return image;
    }

    showProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        const previewImg = document.getElementById('image-preview');
        
        if (product) {
            title.textContent = 'Edit Product';
            this.populateProductForm(product);
            if (product.image) {
                previewImg.src = this.getProductImageUrl(product.image);
                previewImg.style.display = 'block';
                this.currentProductImage = product.image;
            }
        } else {
            title.textContent = 'Add New Product';
            this.clearProductForm();
            if (previewImg) {
                previewImg.style.display = 'none';
            }
            this.currentProductImage = null;
        }
        
        modal.style.display = 'flex';
    }

    hideProductModal() {
        document.getElementById('product-modal').style.display = 'none';
        this.currentProductImage = null;
    }

    populateProductForm(product) {
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-status').value = product.status;
        document.getElementById('product-image-url').value = product.image && !product.image.startsWith('data:image') ? product.image : '';
    }

    clearProductForm() {
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-image-file').value = '';
    }

    async saveProduct() {
        const productId = document.getElementById('product-id').value;
        
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            description: document.getElementById('product-description').value.trim(),
            category: document.getElementById('product-category').value,
            stock: parseInt(document.getElementById('product-stock').value),
            status: document.getElementById('product-status').value,
            image: this.currentProductImage || document.getElementById('product-image-url').value || 'https://via.placeholder.com/300x200/fff9c4/ff6f00?text=🍋'
        };

        if (!productData.name) {
            this.showNotification('Product name is required!', 'error');
            return;
        }

        if (productData.price <= 0) {
            this.showNotification('Price must be greater than 0!', 'error');
            return;
        }

        this.showLoading();
        
        try {
            const url = productId 
                ? `${this.baseURL}/api/products/${productId}` 
                : `${this.baseURL}/api/products`;
            const method = productId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(`Product ${productId ? 'updated' : 'created'} successfully!`, 'success');
                await this.loadProducts();
                this.hideProductModal();
            } else {
                throw new Error(data.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Failed to save product', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
        
        this.showLoading();
        
        try {
            const response = await fetch(`${this.baseURL}/api/products/${productId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Product deleted successfully!', 'success');
                await this.loadProducts();
            } else {
                throw new Error(data.message || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Failed to delete product', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadCustomers() {
        try {
            console.log('📦 Loading customers from backend...');
            const response = await fetch(`${this.baseURL}/api/admin/customers`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Customers response:', data);
            
            if (data.success) {
                this.customers = data.customers || [];
                this.displayCustomers();
            } else {
                throw new Error(data.message || 'Failed to load customers');
            }
        } catch (error) {
            console.error('❌ Error loading customers:', error);
            this.showNotification('Failed to load customers', 'error');
            this.customers = [];
        }
    }

    displayCustomers() {
        const container = document.getElementById('customers-list');
        if (!container) return;

        if (this.customers.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users" style="font-size: 48px; color: #ccc;"></i>
                    <p>No customers found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="customers-table-container">
                <table class="customers-table">
                    <thead>
                        <tr>
                            <th>Customer</th>

                            <th>Contact</th>

                            <th>Orders</th>

                            <th>Total Spent</th>
                            
                            <th>Last Order</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.customers.map(customer => `
                            <tr>
                                <td>
                                    <strong>${customer.name}</strong><br>
                                    <small>Joined: ${new Date(customer.createdAt).toLocaleDateString()}</small>
                                </td>
                                <td>
                                    ${customer.email ? `<div><i class="fas fa-envelope"></i> ${customer.email}</div>` : ''}
                                    ${customer.phone ? `<div><i class="fas fa-phone"></i> ${customer.phone}</div>` : ''}
                                </td>
                                <td><span class="order-count">${customer.orderCount || 0}</span></td>
                                <td><strong>ksh ${(customer.totalSpent || 0).toFixed(2)}</strong></td>
                                <td>${customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Never'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    updateStats() {
        const totalRevenue = this.orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
            
        const totalCustomers = this.customers.length;
        const totalProducts = this.products.length;

        document.getElementById('stat-revenue').textContent = `ksh${totalRevenue.toFixed(2)}`;
        document.getElementById('stat-orders').textContent = this.orders.length;
        document.getElementById('stat-customers').textContent = totalCustomers;
        document.getElementById('stat-products').textContent = totalProducts;
    }

    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            this.showNotification('Order not found', 'error');
            return;
        }

        const items = order.items || [];
        const itemsList = items.map(item => 
            `${item.product} x${item.quantity} - ksh ${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        const details = `
Order Details:

Order: ${order.orderNumber || order.id}
Customer: ${order.customerName || 'Unknown'}
Phone: ${order.customerPhone || 'No phone'}
Email: ${order.customerEmail || 'No email'}
Date: ${new Date(order.date).toLocaleString()}
Status: ${this.formatOrderStatus(order.status)}
Payment: ${order.paymentMethod || 'Unknown'}
Delivery: ${order.deliveryAddress || 'No address'}

Items:
${itemsList || 'No items'}

Total: ksh ${order.total.toFixed(2)}
        `;

        alert(details);
    }

    formatCategory(category) {
        const categories = {
            'classic': 'Classic Drinks',
            'special': 'Specialty Drinks', 
            'treat': 'Sweet Treats'
        };
        return categories[category] || category;
    }

    formatOrderStatus(status) {
        const statusMap = {
            'pending': '⏳ Pending',
            'confirmed': '✅ Confirmed',
            'preparing': '👨‍🍳 Preparing',
            'ready': '📦 Ready',
            'completed': '🚚 Completed',
            'cancelled': '❌ Cancelled'
        };
        return statusMap[status] || status;
    }

    getStockLevel(stock) {
        if (stock === 0) return 'out';
        if (stock <= 5) return 'low';
        if (stock <= 10) return 'medium';
        return 'high';
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.admin-notification').forEach(notif => notif.remove());
        
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Add CSS for animations
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .status-buttons {
        display: flex;
        gap: 0.25rem;
    }
    
    .status-btn {
        padding: 0.4rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s;
    }
    
    .status-btn.preparing { background: #d4edda; color: #155724; }
    .status-btn.ready { background: #cce7ff; color: #004085; }
    .status-btn.completed { background: #d1f7c4; color: #0f5132; }
    
    .stock-indicator {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 500;
    }
    
    .stock-high { background: #d4edda; color: #155724; }
    .stock-medium { background: #fff3cd; color: #856404; }
    .stock-low { background: #f8d7da; color: #721c24; }
    .stock-out { background: #f5f5f5; color: #6c757d; }
    
    .order-count {
        background: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
    }
`;
document.head.appendChild(adminStyles);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminDashboard();
});


// ==============================
// 4-IMAGE UPLOAD FUNCTIONALITY
// ==============================

// Initialize image upload functionality
function initializeImageUpload() {
    console.log('🖼️ Initializing 4-image upload functionality...');
    
    // Setup individual image uploads
    setupImageUploadListeners();
    
    // Setup bulk upload
    setupBulkUpload();
    
    // Setup URL inputs
    setupImageUrlInputs();
}

// Setup listeners for each image upload box
function setupImageUploadListeners() {
    // Handle file selection for each image
    document.querySelectorAll('.product-image-file').forEach(input => {
        input.addEventListener('change', function(e) {
            const index = this.getAttribute('data-index');
            const file = e.target.files[0];
            
            if (file) {
                if (!validateImageFile(file)) {
                    showAlert('Invalid image file. Please upload JPG, PNG or WebP images under 5MB.', 'error');
                    this.value = '';
                    return;
                }
                
                previewImage(file, index);
                // Clear URL input for this image
                document.querySelector(`.product-image-url[data-index="${index}"]`).value = '';
            }
        });
    });
    
    // Handle URL inputs
    document.querySelectorAll('.product-image-url').forEach(input => {
        input.addEventListener('input', function() {
            const index = this.getAttribute('data-index');
            const url = this.value.trim();
            
            if (url) {
                // Clear file input
                document.querySelector(`.product-image-file[data-index="${index}"]`).value = '';
                previewImageFromUrl(url, index);
            } else {
                // Clear preview if URL is empty
                clearImagePreview(index);
            }
        });
    });
    
    // Click on upload box to trigger file input
    document.querySelectorAll('.image-upload-box').forEach(box => {
        box.addEventListener('click', function(e) {
            if (!e.target.classList.contains('remove-image-btn')) {
                const index = this.getAttribute('data-image-index');
                const fileInput = document.querySelector(`.product-image-file[data-index="${index}"]`);
                fileInput.click();
            }
        });
    });
}

// Setup bulk upload functionality
function setupBulkUpload() {
    const bulkUploadBtn = document.getElementById('bulk-upload-btn');
    const bulkUploadInput = document.getElementById('bulk-image-upload');
    
    if (bulkUploadBtn && bulkUploadInput) {
        bulkUploadBtn.addEventListener('click', () => {
            bulkUploadInput.click();
        });
        
        bulkUploadInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            if (files.length > 4) {
                showAlert('Please select maximum 4 images for bulk upload.', 'warning');
                return;
            }
            
            // Sort files by name for consistent assignment
            files.sort((a, b) => a.name.localeCompare(b.name));
            
            // Assign files to each image slot
            files.forEach((file, index) => {
                const imageIndex = index + 1;
                if (imageIndex <= 4 && validateImageFile(file)) {
                    // Simulate file input
                    const fileInput = document.querySelector(`.product-image-file[data-index="${imageIndex}"]`);
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                    
                    // Trigger change event
                    const event = new Event('change', { bubbles: true });
                    fileInput.dispatchEvent(event);
                }
            });
            
            if (files.length < 4) {
                showAlert(`Uploaded ${files.length} images. Please upload ${4 - files.length} more.`, 'info');
            } else {
                showAlert('All 4 images uploaded successfully!', 'success');
            }
        });
    }
}

// Setup image URL inputs
function setupImageUrlInputs() {
    // Add paste functionality to URL inputs
    document.querySelectorAll('.product-image-url').forEach(input => {
        input.addEventListener('paste', function(e) {
            const pastedText = e.clipboardData.getData('text');
            if (isValidImageUrl(pastedText)) {
                // Automatically preview the pasted URL
                setTimeout(() => {
                    const index = this.getAttribute('data-index');
                    previewImageFromUrl(pastedText, index);
                }, 100);
            }
        });
    });
}

// Validate image file
function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
        return false;
    }
    
    if (file.size > maxSize) {
        return false;
    }
    
    return true;
}

// Check if URL is a valid image URL
function isValidImageUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
        return imageExtensions.some(ext => parsedUrl.pathname.toLowerCase().endsWith(ext));
    } catch {
        return false;
    }
}

// Preview image from file
function previewImage(file, index) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const preview = document.getElementById(`image-preview-${index}`);
        const placeholder = document.getElementById(`upload-placeholder-${index}`);
        
        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Add remove button
            addRemoveButton(index);
            
            console.log(`✅ Image ${index} preview loaded`);
        }
    };
    
    reader.readAsDataURL(file);
}

// Preview image from URL
function previewImageFromUrl(url, index) {
    const preview = document.getElementById(`image-preview-${index}`);
    const placeholder = document.getElementById(`upload-placeholder-${index}`);
    
    if (preview && placeholder) {
        preview.src = url;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Add error handler
        preview.onerror = function() {
            showAlert(`Failed to load image ${index} from URL. Please check the URL.`, 'error');
            clearImagePreview(index);
        };
        
        // Add remove button
        addRemoveButton(index);
        
        console.log(`✅ Image ${index} preview loaded from URL`);
    }
}

// Clear image preview
function clearImagePreview(index) {
    const preview = document.getElementById(`image-preview-${index}`);
    const placeholder = document.getElementById(`upload-placeholder-${index}`);
    const fileInput = document.querySelector(`.product-image-file[data-index="${index}"]`);
    const urlInput = document.querySelector(`.product-image-url[data-index="${index}"]`);
    
    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    
    // Remove remove button
    const removeBtn = preview?.parentElement.querySelector('.remove-image-btn');
    if (removeBtn) removeBtn.remove();
}

// Add remove button to image preview
function addRemoveButton(index) {
    const preview = document.getElementById(`image-preview-${index}`);
    if (!preview) return;
    
    // Check if remove button already exists
    if (preview.parentElement.querySelector('.remove-image-btn')) return;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.title = 'Remove image';
    removeBtn.type = 'button';
    
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        clearImagePreview(index);
    });
    
    preview.parentElement.appendChild(removeBtn);
}

// Get all image data from form
function getProductImagesData() {
    const images = [];
    let hasErrors = false;
    
    for (let i = 1; i <= 4; i++) {
        const fileInput = document.querySelector(`.product-image-file[data-index="${i}"]`);
        const urlInput = document.querySelector(`.product-image-url[data-index="${i}"]`);
        const preview = document.getElementById(`image-preview-${i}`);
        
        let imageData = null;
        
        // Check file input first
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (validateImageFile(file)) {
                imageData = {
                    type: 'file',
                    file: file,
                    index: i,
                    url: URL.createObjectURL(file)
                };
            } else {
                showAlert(`Image ${i}: Invalid file format or size > 5MB`, 'error');
                hasErrors = true;
            }
        }
        // Check URL input
        else if (urlInput.value.trim()) {
            const url = urlInput.value.trim();
            if (isValidImageUrl(url)) {
                imageData = {
                    type: 'url',
                    url: url,
                    index: i
                };
            } else {
                showAlert(`Image ${i}: Invalid image URL`, 'error');
                hasErrors = true;
            }
        }
        // Check if image is already previewed (from edit mode)
        else if (preview && preview.src && !preview.src.includes('data:image')) {
            imageData = {
                type: 'existing',
                url: preview.src,
                index: i
            };
        }
        
        if (imageData) {
            images.push(imageData);
        } else {
            showAlert(`Image ${i} is required`, 'error');
            hasErrors = true;
        }
    }
    
    if (hasErrors) {
        return null;
    }
    
    return images;
}

// Prepare images for submission
async function prepareImagesForSubmission(images) {
    const imageUrls = [];
    
    for (const imageData of images) {
        if (imageData.type === 'file') {
            // Convert file to base64 for API submission
            try {
                const base64 = await fileToBase64(imageData.file);
                imageUrls.push(base64);
            } catch (error) {
                console.error('Error converting file to base64:', error);
                imageUrls.push(imageData.url); // Fallback to object URL
            }
        } else {
            imageUrls.push(imageData.url);
        }
    }
    
    return imageUrls;
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Update product form to handle multiple images
function updateProductFormForEdit(product) {
    // Clear all image previews first
    for (let i = 1; i <= 4; i++) {
        clearImagePreview(i);
    }
    
    // Load product images
    if (product.images && Array.isArray(product.images)) {
        product.images.forEach((imageUrl, index) => {
            if (index < 4) {
                const imageIndex = index + 1;
                previewImageFromUrl(imageUrl, imageIndex);
            }
        });
    } else if (product.image) {
        // For backward compatibility - single image
        previewImageFromUrl(product.image, 1);
    }
}

// ==============================
// UPDATE EXISTING FORM HANDLING
// ==============================

// Update your existing form submission handler
// Find your product form submission and update it:

// In your existing admin.js, find where you handle product form submission
// and update it to use multiple images:

document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get all form data
    const productData = {
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        stock: parseInt(document.getElementById('product-stock').value),
        minStock: parseInt(document.getElementById('product-min-stock').value) || 5,
        status: document.getElementById('product-status').value,
        tags: document.getElementById('product-tags').value.split(',').map(tag => tag.trim())
    };
    
    // Get product ID for edit mode
    const productId = document.getElementById('product-id').value;
    if (productId) {
        productData.id = productId;
    }
    
    // Get images data
    const imagesData = getProductImagesData();
    if (!imagesData) {
        showAlert('Please upload all 4 product images', 'error');
        return;
    }
    
    // Prepare images for API
    try {
        productData.images = await prepareImagesForSubmission(imagesData);
        
        // Call your API to save product
        await saveProductToAPI(productData);
        
        // Show success message
        showAlert(productId ? 'Product updated successfully!' : 'Product added successfully!', 'success');
        
        // Close modal and refresh products
        closeProductModal();
        loadProducts();
        
    } catch (error) {
        console.error('Error saving product:', error);
        showAlert('Error saving product: ' + error.message, 'error');
    }
});

// ==============================
// UPDATE PRODUCT DISPLAY IN TABLE
// ==============================

// Update how products are displayed in the table
function displayProductInTable(product) {
    // Create images cell with multiple thumbnails
    const imagesCell = document.createElement('td');
    imagesCell.className = 'product-images-cell';
    
    if (product.images && product.images.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'product-images-thumbnails';
        imagesContainer.style.display = 'flex';
        imagesContainer.style.gap = '5px';
        imagesContainer.style.flexWrap = 'wrap';
        
        // Show up to 3 thumbnails
        product.images.slice(0, 3).forEach((img, index) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'product-image-thumb';
            imgWrapper.style.position = 'relative';
            imgWrapper.style.width = '30px';
            imgWrapper.style.height = '30px';
            imgWrapper.style.borderRadius = '4px';
            imgWrapper.style.overflow = 'hidden';
            imgWrapper.style.border = '1px solid var(--border-color)';
            
            const imgElement = document.createElement('img');
            imgElement.src = img;
            imgElement.alt = `Image ${index + 1}`;
            imgElement.style.width = '100%';
            imgElement.style.height = '100%';
            imgElement.style.objectFit = 'cover';
            
            // Tooltip with image number
            imgWrapper.title = `Image ${index + 1}`;
            
            imgWrapper.appendChild(imgElement);
            imagesContainer.appendChild(imgWrapper);
        });
        
        // Show count badge if more than 3 images
        if (product.images.length > 3) {
            const badge = document.createElement('span');
            badge.className = 'image-count-badge';
            badge.textContent = `+${product.images.length - 3}`;
            badge.style.background = 'var(--primary-color)';
            badge.style.color = 'white';
            badge.style.fontSize = '10px';
            badge.style.padding = '2px 5px';
            badge.style.borderRadius = '10px';
            badge.style.marginLeft = '5px';
            imagesContainer.appendChild(badge);
        }
        
        imagesCell.appendChild(imagesContainer);
    } else if (product.image) {
        // Backward compatibility - single image
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;
        img.className = 'product-image-cell';
        imagesCell.appendChild(img);
    } else {
        imagesCell.innerHTML = '<span class="no-image">No images</span>';
    }
    
    // Rest of your table row creation remains the same...
    // [Your existing code for other cells]
}