
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

// MONGODB CONNECTION
let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing.');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      })
      .then(() => {
        console.log('MongoDB Connected Successfully!');
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

// CORS CONFIGURATION
// Allow deployed React website and local Flutter Web.
// Flutter Web may use a different localhost port.

const allowedOrigins = new Set(
  CLIENT_URL.split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

allowedOrigins.add('http://localhost:5173');

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);

    const isLocalHost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]';

    return parsed.protocol === 'http:' && isLocalHost;
  } catch (_) {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error('Origin not allowed by CORS.')
      );
    },
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

// JSON MIDDLEWARE
app.use(express.json({ limit: '1mb' }));

// DATABASE CONNECTION MIDDLEWARE
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      'Database connection failed:',
      error.message
    );

    res.status(503).json({
      message: 'Database connection is unavailable.'
    });
  }
});

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

// LOCAL DEVELOPMENT
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(
      'Failed to start server:',
      error.message
    );

    process.exit(1);
  }
}

// VERCEL SERVERLESS MODE
if (!process.env.VERCEL) {
  startServer();
}

// EXPORT EXPRESS APP FOR VERCEL
module.exports = app;
