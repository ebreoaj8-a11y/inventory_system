
const express = require('express');
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const logActivity = require('../utils/logActivity');

const router = express.Router();

// VALIDATE MONGODB ID
function validId(id) {
  return mongoose.isValidObjectId(id);
}

// SEND ERROR RESPONSE
function sendError(res, status, message) {
  return res.status(status).json({ message });
}

// HANDLE DATABASE ERRORS
function errorResponse(res, error) {
  if (error.code === 11000) {
    return sendError(
      res,
      409,
      'Duplicate record detected.'
    );
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');

    return sendError(res, 400, message);
  }

  if (error.name === 'CastError') {
    return sendError(res, 400, 'Invalid order data.');
  }

  console.error('Order API error:', error);

  return sendError(
    res,
    500,
    'Unable to process order request.'
  );
}

// VALIDATE POSITIVE WHOLE NUMBER
function validQuantity(value) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    typeof value === 'boolean' ||
    typeof value === 'object'
  ) {
    return false;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0;
}

// VALIDATE NON-NEGATIVE PRICE
function validPrice(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    Number.isSafeInteger(Math.round(value * 100)) &&
    Math.abs(
      value * 100 - Math.round(value * 100)
    ) <= 1e-7
  );
}

// CALCULATE TOTAL AMOUNT
function calculateTotal(price, quantity) {
  if (!validPrice(price) || !validQuantity(quantity)) {
    return null;
  }

  const totalCents =
    Math.round(price * 100) * Number(quantity);

  if (!Number.isSafeInteger(totalCents)) {
    return null;
  }

  return totalCents / 100;
}

// RECORD ACTIVITY SAFELY
async function recordActivity(type, message) {
  try {
    await logActivity(type, message);
  } catch (error) {
    console.error(
      'Activity logging failed:',
      error.message
    );
  }
}

// GET ALL ORDERS
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json(orders);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// CREATE ORDER
router.post('/', async (req, res) => {
  try {
    const { productId, quantity } = req.body || {};

    if (!validId(productId)) {
      return sendError(
        res,
        400,
        'Choose a valid product.'
      );
    }

    if (!validQuantity(quantity)) {
      return sendError(
        res,
        400,
        'Quantity must be a positive whole number.'
      );
    }

    const qty = Number(quantity);

    const product = await Product.findById(productId);

    if (!product) {
      return sendError(
        res,
        404,
        'Product not found.'
      );
    }

    const supplier = await Supplier.findOne({
      supplierId: product.supplierId
    });

    if (!supplier) {
      return sendError(
        res,
        400,
        'The product has no active supplier. Assign a supplier first.'
      );
    }

    const unitPrice = Number(product.price);

    if (!validPrice(unitPrice)) {
      return sendError(
        res,
        400,
        'Product price is invalid.'
      );
    }

    const totalAmount = calculateTotal(
      unitPrice,
      qty
    );

    if (totalAmount === null) {
      return sendError(
        res,
        400,
        'Order total is too large.'
      );
    }

    const order = await Order.create({
      product: product._id,
      supplierId: supplier.supplierId,
      quantity: qty,
      unitPrice,
      totalAmount,
      productName: product.name,
      supplierName: supplier.name,
      status: 'Pending'
    });

    await recordActivity(
      'order',
      `Created purchase order for ${qty} units of ${product.name}`
    );

    return res.status(201).json(order);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// UPDATE PENDING ORDER QUANTITY
router.put('/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return sendError(res, 400, 'Invalid order ID.');
  }

  const quantity = req.body?.quantity;

  if (!validQuantity(quantity)) {
    return sendError(
      res,
      400,
      'Quantity must be a positive whole number.'
    );
  }

  const qty = Number(quantity);

  try {
    const existingOrder = await Order.findById(
      req.params.id
    );

    if (!existingOrder) {
      return sendError(res, 404, 'Order not found.');
    }

    if (existingOrder.status !== 'Pending') {
      return sendError(
        res,
        409,
        'Only pending orders can be edited.'
      );
    }

    const totalAmount = calculateTotal(
      existingOrder.unitPrice,
      qty
    );

    if (totalAmount === null) {
      return sendError(
        res,
        400,
        'Order total is too large.'
      );
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'Pending'
      },
      {
        $set: {
          quantity: qty,
          totalAmount
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedOrder) {
      return sendError(
        res,
        409,
        'Order is no longer pending.'
      );
    }

    await recordActivity(
      'edit',
      `Updated purchase order for ${updatedOrder.productName} to ${qty} units`
    );

    return res.json(updatedOrder);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// RECEIVE ORDER
router.patch('/:id/receive', async (req, res) => {
  if (!validId(req.params.id)) {
    return sendError(res, 400, 'Invalid order ID.');
  }

  let session;

  try {
    session = await mongoose.startSession();

    let updatedOrder;

    // BOTH OPERATIONS MUST SUCCEED TOGETHER.
    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          status: 'Pending'
        },
        {
          $set: {
            status: 'Received',
            receivedAt: new Date()
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!order) {
        throw new Error('ORDER_NOT_PENDING');
      }

      // PREVENT STOCK OVERFLOW AT THE DATABASE LEVEL.
      const maxAllowedQuantity =
        Number.MAX_SAFE_INTEGER - order.quantity;

      const product = await Product.findOneAndUpdate(
        {
          _id: order.product,
          quantity: {
            $gte: 0,
            $lte: maxAllowedQuantity
          }
        },
        {
          $inc: {
            quantity: order.quantity
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!product) {
        // DISTINGUISH MISSING PRODUCT FROM OVERFLOW.
        const existingProduct = await Product.exists({
          _id: order.product
        }).session(session);

        if (!existingProduct) {
          throw new Error('PRODUCT_NOT_FOUND');
        }

        throw new Error('STOCK_LIMIT_EXCEEDED');
      }

      updatedOrder = order;
    });

    // LOG ONLY AFTER THE TRANSACTION COMMITS.
    await recordActivity(
      'in',
      `Received ${updatedOrder.quantity} units of ${updatedOrder.productName}`
    );

    return res.json({
      message: 'Order received and inventory updated.',
      order: updatedOrder
    });
  } catch (error) {
    if (error.message === 'ORDER_NOT_PENDING') {
      return sendError(
        res,
        409,
        'Order is not pending or no longer exists.'
      );
    }

    if (error.message === 'PRODUCT_NOT_FOUND') {
      return sendError(
        res,
        404,
        'The ordered product no longer exists.'
      );
    }

    if (error.message === 'STOCK_LIMIT_EXCEEDED') {
      return sendError(
        res,
        409,
        'Cannot receive order because the resulting stock quantity exceeds the allowed limit.'
      );
    }

    return errorResponse(res, error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

// CANCEL PENDING ORDER
router.patch('/:id/cancel', async (req, res) => {
  if (!validId(req.params.id)) {
    return sendError(res, 400, 'Invalid order ID.');
  }

  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'Pending'
      },
      {
        $set: {
          status: 'Cancelled'
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      const existing = await Order.exists({
        _id: req.params.id
      });

      return sendError(
        res,
        existing ? 409 : 404,
        existing
          ? 'Only pending orders can be cancelled.'
          : 'Order not found.'
      );
    }

    await recordActivity(
      'del',
      `Cancelled purchase order for ${order.productName}`
    );

    return res.json(order);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// DELETE CANCELLED ORDER
router.delete('/:id', async (req, res) => {
  if (!validId(req.params.id)) {
    return sendError(res, 400, 'Invalid order ID.');
  }

  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      status: 'Cancelled'
    });

    if (!order) {
      const existing = await Order.exists({
        _id: req.params.id
      });

      return sendError(
        res,
        existing ? 409 : 404,
        existing
          ? 'Only cancelled orders can be deleted.'
          : 'Order not found.'
      );
    }

    await recordActivity(
      'del',
      `Deleted cancelled order for ${order.productName}`
    );

    return res.json({
      message: 'Cancelled order deleted successfully.'
    });
  } catch (error) {
    return errorResponse(res, error);
  }
});

module.exports = router;
