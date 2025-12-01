// server.js - Production Ready for Render.com
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000; // Render provides PORT
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Middleware
app.use(cors({
  origin: '*', // Or specify frontend domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// Ensure data and uploads directories exist
async function ensureDirectories() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        
        // Initialize files if they don't exist
        const files = ['products.json', 'orders.json', 'users.json', 'customers.json'];
        for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, '[]');
            }
        }
    } catch (error) {
        console.error('Error creating directories:', error);
    }
}

// Helper functions
async function readJSON(filename) {
    try {
        const data = await fs.readFile(path.join(DATA_DIR, filename), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeJSON(filename, data) {
    await fs.writeFile(
        path.join(DATA_DIR, filename),
        JSON.stringify(data, null, 2)
    );
}

// Save base64 image to file
async function saveBase64Image(base64Data, filename) {
    try {
        // Remove data:image/...;base64, prefix
        const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64String, 'base64');
        
        const filePath = path.join(UPLOADS_DIR, filename);
        await fs.writeFile(filePath, buffer);
        
        return `/uploads/${filename}`;
    } catch (error) {
        console.error('Error saving image:', error);
        return null;
    }
}

// ============ ROUTES ============

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ============ AUTHENTICATION ============

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        if (!name || (!email && !phone)) {
            return res.status(400).json({
                success: false,
                message: 'Name and either email or phone required'
            });
        }
        
        const users = await readJSON('users.json');
        
        // Check if user exists
        const existingUser = users.find(u => 
            (email && u.email === email) || (phone && u.phone === phone)
        );
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        const newUser = {
            id: Date.now(),
            name,
            email: email || null,
            phone: phone || null,
            password,
            createdAt: new Date().toISOString(),
            orders: 0,
            totalSpent: 0,
            lastOrder: null
        };
        
        users.push(newUser);
        await writeJSON('users.json', users);
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Signup successful'
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        
        const users = await readJSON('users.json');
        
        const user = users.find(u => 
            (email && u.email === email) || (phone && u.phone === phone)
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            user: userWithoutPassword,
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// ============ PRODUCTS ============

app.get('/api/products', async (req, res) => {
    try {
        const products = await readJSON('products.json');
        res.json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load products'
        });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const products = await readJSON('products.json');
        const productData = req.body;
        
        let imageUrl = productData.image;
        
        // Handle base64 image upload
        if (productData.image && productData.image.startsWith('data:image')) {
            const filename = `product_${Date.now()}.png`;
            imageUrl = await saveBase64Image(productData.image, filename);
            
            if (!imageUrl) {
                imageUrl = 'https://via.placeholder.com/300x200/fff9c4/ff6f00?text=🍋';
            }
        }
        
        const newProduct = {
            id: Date.now(),
            ...productData,
            image: imageUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        await writeJSON('products.json', products);
        
        res.json({
            success: true,
            product: newProduct,
            message: 'Product created successfully'
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product'
        });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const products = await readJSON('products.json');
        const productId = parseInt(req.params.id);
        const productData = req.body;
        
        const index = products.findIndex(p => p.id === productId);
        
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        let imageUrl = productData.image;
        
        // Handle base64 image upload for updates
        if (productData.image && productData.image.startsWith('data:image')) {
            const filename = `product_${Date.now()}.png`;
            imageUrl = await saveBase64Image(productData.image, filename);
            
            if (!imageUrl) {
                imageUrl = products[index].image; // Keep existing image if upload fails
            }
        }
        
        products[index] = {
            ...products[index],
            ...productData,
            image: imageUrl,
            id: productId,
            updatedAt: new Date().toISOString()
        };
        
        await writeJSON('products.json', products);
        
        res.json({
            success: true,
            product: products[index],
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product'
        });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await readJSON('products.json');
        const productId = parseInt(req.params.id);
        
        const filteredProducts = products.filter(p => p.id !== productId);
        
        if (filteredProducts.length === products.length) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        
        await writeJSON('products.json', filteredProducts);
        
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});

// ============ ORDERS ============

app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await readJSON('orders.json');
        res.json({
            success: true,
            orders: orders,
            source: 'backend'
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load orders'
        });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const orders = await readJSON('orders.json');
        const orderData = req.body;
        
        const newOrder = {
            id: `order_${Date.now()}`,
            orderNumber: `LL${String(orders.length + 1).padStart(4, '0')}`,
            ...orderData,
            status: 'pending',
            paymentStatus: orderData.paymentMethod === 'cash' ? 'pending_cod' : 'pending',
            date: new Date().toISOString(),
            completedAt: null
        };
        
        orders.push(newOrder);
        await writeJSON('orders.json', orders);
        
        // Update user's order count if customerId is provided
        if (orderData.customerId) {
            const users = await readJSON('users.json');
            const userIndex = users.findIndex(u => u.id === orderData.customerId);
            
            if (userIndex !== -1) {
                users[userIndex].orders = (users[userIndex].orders || 0) + 1;
                users[userIndex].totalSpent = (users[userIndex].totalSpent || 0) + parseFloat(orderData.total);
                users[userIndex].lastOrder = new Date().toISOString();
                
                await writeJSON('users.json', users);
            }
        }
        
        res.json({
            success: true,
            order: newOrder,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const orders = await readJSON('orders.json');
        const orderId = req.params.id;
        const { status } = req.body;
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        orders[orderIndex].status = status;
        if (status === 'completed') {
            orders[orderIndex].completedAt = new Date().toISOString();
        }
        
        await writeJSON('orders.json', orders);
        
        res.json({
            success: true,
            order: orders[orderIndex],
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order'
        });
    }
});

app.get('/api/user/orders/:userId', async (req, res) => {
    try {
        const orders = await readJSON('orders.json');
        const userId = parseInt(req.params.userId);
        
        // Get user to match by phone/email
        const users = await readJSON('users.json');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const userOrders = orders.filter(order => 
            order.customerId === userId || 
            order.customerPhone === user.phone || 
            order.customerEmail === user.email
        );
        
        // Sort by date, newest first
        userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({
            success: true,
            orders: userOrders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order history'
        });
    }
});

// ============ REVENUE & ANALYTICS ============

app.get('/api/admin/revenue', async (req, res) => {
    try {
        const orders = await readJSON('orders.json');
        const { period = 'all' } = req.query;
        
        const now = new Date();
        let filteredOrders = orders.filter(order => order.status === 'completed');
        
        if (period === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredOrders = filteredOrders.filter(order => new Date(order.completedAt) >= today);
        } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredOrders = filteredOrders.filter(order => new Date(order.completedAt) >= weekAgo);
        } else if (period === 'month') {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredOrders = filteredOrders.filter(order => new Date(order.completedAt) >= monthAgo);
        }
        
        const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const orderCount = filteredOrders.length;
        
        res.json({
            success: true,
            revenue: totalRevenue,
            orderCount: orderCount,
            period: period
        });
    } catch (error) {
        console.error('Error fetching revenue:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue data'
        });
    }
});

// ============ CUSTOMERS ============

app.get('/api/admin/customers', async (req, res) => {
    try {
        const users = await readJSON('users.json');
        const orders = await readJSON('orders.json');
        
        const customersWithStats = users.map(user => {
            const userOrders = orders.filter(order => 
                order.customerPhone === user.phone || order.customerEmail === user.email
            );
            
            const completedOrders = userOrders.filter(order => order.status === 'completed');
            const totalSpent = completedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
            
            let lastOrder = null;
            if (userOrders.length > 0) {
                const sortedOrders = userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
                lastOrder = sortedOrders[0].date;
            }
            
            return {
                ...user,
                orderCount: userOrders.length,
                completedOrderCount: completedOrders.length,
                totalSpent: totalSpent,
                lastOrder: lastOrder
            };
        });
        
        res.json({
            success: true,
            customers: customersWithStats
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load customers'
        });
    }
});

// ============ USER ADDRESS ============

app.put('/api/user/address/:userId', async (req, res) => {
    try {
        const users = await readJSON('users.json');
        const userId = parseInt(req.params.userId);
        const { address } = req.body;
        
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        users[userIndex].address = address;
        users[userIndex].updatedAt = new Date().toISOString();
        
        await writeJSON('users.json', users);
        
        res.json({
            success: true,
            user: users[userIndex],
            message: 'Address updated successfully'
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address'
        });
    }
});

// ============ START SERVER ============

async function startServer() {
    await ensureDirectories();
    
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
🍋 Lily's Lemonade Backend Server - PRODUCTION
==============================================
✅ Server running on port: ${PORT}
✅ Environment: ${process.env.NODE_ENV || 'development'}
✅ Health check: /health
✅ Frontend: /
✅ Admin Panel: /admin

📊 API Endpoints:
- POST /api/auth/signup
- POST /api/auth/login  
- GET  /api/products
- POST /api/products
- PUT  /api/products/:id
- DELETE /api/products/:id
- GET  /api/admin/orders
- POST /api/orders
- PUT  /api/orders/:id
- GET  /api/admin/revenue
- GET  /api/admin/customers
- GET  /api/user/orders/:userId
- PUT  /api/user/address/:userId

     `);
    });
}

startServer().catch(console.error);

