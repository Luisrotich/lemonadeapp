// server.js - Production Ready for Railway with PostgreSQL
const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const path = require('path');

const app = express();
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDatabase() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        orders INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_order TIMESTAMP NULL,
        address TEXT
      )
    `);

    // Customers table (fixed syntax)
    await query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, phone)
      )
    `);

    // Products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add status column if it doesn't exist (for existing tables)
    try {
      await query(`
        ALTER TABLE products
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'
      `);
      console.log('Status column added to products table');
    } catch (alterError) {
      console.error('Error adding status column:', alterError);
    }

    // Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        order_number VARCHAR(20) UNIQUE NOT NULL,
        customer_id INTEGER REFERENCES users(id),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(20),
        items JSONB NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        payment_status VARCHAR(50) DEFAULT 'pending',
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL
      )
    `);

    // Update existing products to have 'active' status if they don't have one
    try {
      await query(`
        UPDATE products
        SET status = 'active'
        WHERE status IS NULL OR status = ''
      `);
      console.log('Existing products updated with active status');
    } catch (updateError) {
      console.error('Error updating existing products:', updateError);
    }

    // Migrate data from JSON files to PostgreSQL (simplified)
    try {
      const fs = require('fs');

      // Check if products table is empty before migrating
      const existingProducts = await query('SELECT COUNT(*) as count FROM products');
      if (parseInt(existingProducts.rows[0].count) > 0) {
        console.log('Products already exist in database, skipping migration');
      } else {
        // Migrate products
        const productsPath = path.join(__dirname, 'data', 'products.json');
        if (fs.existsSync(productsPath)) {
          const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
          console.log(`Found ${productsData.length} products in JSON file`);

          for (const product of productsData) {
            try {
              // Insert without ID to let SERIAL generate it
              await query(`
                INSERT INTO products (name, description, price, image, category, stock, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                product.name,
                product.description || '',
                parseFloat(product.price) || 0,
                product.image || '',
                product.category || '',
                parseInt(product.stock) || 0,
                product.status || 'active',
                product.createdAt ? new Date(product.createdAt) : new Date(),
                product.updatedAt ? new Date(product.updatedAt) : new Date()
              ]);
            } catch (insertError) {
              console.error('Error inserting product:', product.name, insertError.message);
            }
          }
          console.log('Products migration completed');
        }
      }

    } catch (migrationError) {
      console.error('Error during data migration:', migrationError.message);
      // Don't throw error - allow server to start even if migration fails
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Routes
app.get('/', (req, res) => {
  res.send('Server running with PostgreSQL');
});

// Signup route
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const result = await query(
      `INSERT INTO users (name, email, phone, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone`,
      [name, email, phone, password]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, error: 'Signup failed' });
  }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
  const { email, phone, password } = req.body;

  try {
    const result = await query(
      `SELECT id, name, email, phone
       FROM users
       WHERE (email = $1 OR phone = $2) AND password = $3`,
      [email, phone, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ✅ Get all products (homepage + admin)
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');

    // ✅ Convert DECIMAL price → number
    const products = result.rows.map(p => ({
      ...p,
      price: Number(p.price)
    }));

    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ✅ Get all customers
app.get('/api/admin/customers', async (req, res) => {
  try {
    const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json({ success: true, customers: result.rows });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// ✅ Get all orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY date DESC');
    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// ✅ Create product
app.post('/api/products', async (req, res) => {
  const { name, description, price, image, category, stock } = req.body;

  try {
    const result = await query(
      `INSERT INTO products (name, description, price, image, category, stock)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, image, category, stock]
    );

    const product = {
      ...result.rows[0],
      price: Number(result.rows[0].price)
    };

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// ✅ Update product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, stock } = req.body;

  try {
    const result = await query(
      `UPDATE products
       SET name=$1, description=$2, price=$3, image=$4, category=$5, stock=$6, updated_at=CURRENT_TIMESTAMP
       WHERE id=$7
       RETURNING *`,
      [name, description, price, image, category, stock, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const product = {
      ...result.rows[0],
      price: Number(result.rows[0].price)
    };

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// ✅ Delete product
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM products WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// ✅ Checkout Routes

// Create new order
app.post('/api/orders', async (req, res) => {
  const { customerId, customerName, customerEmail, customerPhone, items, total, paymentMethod } = req.body;

  try {
    // Generate unique order ID and order number
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderNumber = `ORD-${Date.now()}`;

    // Set payment_status and status based on payment method
    let paymentStatus = 'pending';
    let status = 'pending';

    if (paymentMethod === 'cash_on_delivery') {
      paymentStatus = 'cash_on_delivery';
      status = 'confirmed';
    }

    const result = await query(
      `INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, items, total, status, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [orderId, orderNumber, customerId, customerName, customerEmail, customerPhone, JSON.stringify(items), total, status, paymentMethod, paymentStatus]
    );

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Get specific order details
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Update order status (for admin or payment processing)
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  try {
    const result = await query(
      `UPDATE orders
       SET status = $1, payment_status = $2, completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $3
       RETURNING *`,
      [status, paymentStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

// M-Pesa payment callback handler
app.post('/api/orders/:id/payment/callback', async (req, res) => {
  const { id } = req.params;
  const { ResultCode, ResultDesc, CallbackMetadata } = req.body.Body?.stkCallback || {};

  try {
    let paymentStatus = 'failed';
    let orderStatus = 'pending';

    if (ResultCode === 0) {
      paymentStatus = 'completed';
      orderStatus = 'confirmed';
    }

    const result = await query(
      `UPDATE orders
       SET payment_status = $1, status = $2, completed_at = CASE WHEN $2 = 'confirmed' THEN CURRENT_TIMESTAMP ELSE completed_at END
       WHERE id = $3
       RETURNING *`,
      [paymentStatus, orderStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    console.log(`Payment callback processed for order ${id}: ${ResultDesc}`);

    res.json({ success: true, message: 'Payment callback processed' });
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment callback' });
  }
});

// Get user orders (already exists, but ensuring it's properly placed)
app.get('/api/user/orders/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY date DESC',
      [userId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user orders' });
  }
});

// Start server after DB init
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  // Start server anyway to allow API endpoints to respond with errors
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (database initialization failed)`);
  });
});
