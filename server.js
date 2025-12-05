// server.js - Production Ready for Railway with PostgreSQL
const express = require('express');
const cors = require('cors');
const { query } = require('./db');
const path = require('path');

const app = express();
app.use(express.static('public'));
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

    // Migrate data from JSON files to PostgreSQL
    try {
      const fs = require('fs');
      const path = require('path');

      // Migrate products
      const productsPath = path.join(__dirname, 'data', 'products.json');
      if (fs.existsSync(productsPath)) {
        const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        console.log(`Found ${productsData.length} products in JSON file`);

        for (const product of productsData) {
          try {
            await query(`
              INSERT INTO products (id, name, description, price, image, category, stock, status, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO NOTHING
            `, [
              product.id,
              product.name,
              product.description,
              product.price,
              product.image,
              product.category,
              product.stock,
              product.status || 'active',
              product.createdAt ? new Date(product.createdAt) : new Date(),
              product.updatedAt ? new Date(product.updatedAt) : new Date()
            ]);
          } catch (insertError) {
            console.error('Error inserting product:', product.name, insertError);
          }
        }
        console.log('Products migration completed');
      }

      // Migrate customers
      const customersPath = path.join(__dirname, 'data', 'customers.json');
      if (fs.existsSync(customersPath)) {
        const customersData = JSON.parse(fs.readFileSync(customersPath, 'utf8'));
        console.log(`Found ${customersData.length} customers in JSON file`);

        for (const customer of customersData) {
          try {
            await query(`
              INSERT INTO customers (id, name, email, phone, address, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (id) DO NOTHING
            `, [
              customer.id,
              customer.name,
              customer.email,
              customer.phone,
              customer.address,
              customer.createdAt ? new Date(customer.createdAt) : new Date(),
              customer.updatedAt ? new Date(customer.updatedAt) : new Date()
            ]);
          } catch (insertError) {
            console.error('Error inserting customer:', customer.name, insertError);
          }
        }
        console.log('Customers migration completed');
      }

      // Migrate users
      const usersPath = path.join(__dirname, 'data', 'users.json');
      if (fs.existsSync(usersPath)) {
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        console.log(`Found ${usersData.length} users in JSON file`);

        for (const user of usersData) {
          try {
            await query(`
              INSERT INTO users (id, name, email, phone, password, created_at, orders, total_spent, last_order, address)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO NOTHING
            `, [
              user.id,
              user.name,
              user.email,
              user.phone,
              user.password,
              user.createdAt ? new Date(user.createdAt) : new Date(),
              user.orders || 0,
              user.totalSpent || 0,
              user.lastOrder ? new Date(user.lastOrder) : null,
              user.address
            ]);
          } catch (insertError) {
            console.error('Error inserting user:', user.name, insertError);
          }
        }
        console.log('Users migration completed');
      }

      // Migrate orders
      const ordersPath = path.join(__dirname, 'data', 'orders.json');
      if (fs.existsSync(ordersPath)) {
        const ordersData = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
        console.log(`Found ${ordersData.length} orders in JSON file`);

        for (const order of ordersData) {
          try {
            await query(`
              INSERT INTO orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, items, total, status, payment_method, payment_status, date, completed_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              ON CONFLICT (id) DO NOTHING
            `, [
              order.id,
              order.orderNumber || order.id,
              order.customerId,
              order.customerName,
              order.customerEmail,
              order.customerPhone,
              JSON.stringify(order.items || []),
              order.total,
              order.status || 'pending',
              order.paymentMethod,
              order.paymentStatus || 'pending',
              order.date ? new Date(order.date) : new Date(),
              order.completedAt ? new Date(order.completedAt) : null
            ]);
          } catch (insertError) {
            console.error('Error inserting order:', order.id, insertError);
          }
        }
        console.log('Orders migration completed');
      }

    } catch (migrationError) {
      console.error('Error during data migration:', migrationError);
    }

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

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