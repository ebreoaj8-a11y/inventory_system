
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const orderRoutes = require('./routes/orderRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// MIDDLEWARE
app.use(
  cors({
    origin: CLIENT_URL
  })
);

app.use(express.json({ limit: '1mb' }));

// HEALTH CHECK
app.get('/', (req, res) => {
  res.json({
    message: 'Stockroom API is running!',
    database:
      mongoose.connection.readyState === 1
        ? 'connected'
        : 'disconnected'
  });
});

// API ROUTES
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/activity', activityRoutes);

// ROUTE NOT FOUND
app.use((req, res) => {
  res.status(404).json({
    message: 'API endpoint not found.'
  });
});

// GLOBAL ERROR HANDLER
app.use((error, req, res, next) => {
  console.error('Server error:', error.message);

  if (res.headersSent) {
    return next(error);
  }

  const status =
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status <= 599
      ? error.status
      : 500;

  res.status(status).json({
    message:
      status >= 500
        ? 'An unexpected server error occurred.'
        : error.message
  });
});

// START SERVER
async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing in the .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected Successfully!');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

startServer();
