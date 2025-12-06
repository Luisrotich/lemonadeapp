// admin.js - Enhanced with better error handling and real-time updates
class AdminDashboard {
    constructor() {
        this.orders = [];
        this.products = [];
        this.customers = [];
        this.currentUser = null;
        this.baseURL = this.detectBaseURL();
        this.currentProductImage = null;

        this.init();
    }

    detectBaseURL() {
        // Try Railway URL first, fallback to localhost for development
        const railwayURL = 'https://lemonadeapp-production-611f.up.railway.app';
        const localhostURL = 'http://localhost:3000';

        // Check if we're running on localhost (development)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return localhostURL;
        }

        // For production, use Railway URL
        return railwayURL;
    }

    async fetchWithFallback(url, options = {}) {
        const urls = [
            `${this.baseURL}${url}`,
            `http://localhost:3000${url}`
        ];

        for (const fullUrl of urls) {
            try {
                console.log(`🔄 Trying to fetch: ${fullUrl}`);
                const response = await fetch(fullUrl, options);

                if (response.ok) {
                    console.log(`✅ Successfully fetched from: ${fullUrl}`);
                    return response;
                } else {
                    console.warn(`⚠️ Response not OK from ${fullUrl}: ${response.status}`);
                }
            } catch (error) {
                console.warn(`❌ Failed to fetch from ${fullUrl}:`, error.message);
                // Continue to next URL
            }
        }

        throw new Error(`Failed to fetch ${url} from all available endpoints`);
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
            const response = await this.fetchWithFallback('/api/admin/orders');

            const data = await response.json();
            console.log('📦 Orders response:', data);

            // Server returns array directly, not wrapped in success object
            this.orders = Array.isArray(data) ? data : [];
            this.displayOrders();
            this.updateOrderStats();
            this.updatePendingBadge();
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
            const response = await this.fetchWithFallback(`/api/orders/${orderId}`, {
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
            const response = await this.fetchWithFallback('/api/products');

            const data = await response.json();
            console.log('📦 Products response:', data);

            // Server returns array directly, not wrapped in success object
            this.products = Array.isArray(data) ? data : [];
            this.displayProducts();
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
                ? `/api/products/${productId}`
                : `/api/products`;
            const method = productId ? 'PUT' : 'POST';

            const response = await this.fetchWithFallback(url, {
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
            const response = await this.fetchWithFallback(`/api/products/${productId}`, {
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
            const response = await this.fetchWithFallback('/api/admin/customers');

            const data = await response.json();
            console.log('📦 Customers response:', data);

            // Server returns array directly, not wrapped in success object
            this.customers = Array.isArray(data) ? data : [];
            this.displayCustomers();
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