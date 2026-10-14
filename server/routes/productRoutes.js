
const express = require('express');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Order = require('../models/Order');
const logActivity = require('../utils/logActivity');

const router = express.Router();

const fields = [
  'name',
  'sku',
  'category',
  'quantity',
  'reorder',
  'price',
  'supplierId'
];

const validCategories = [
  'Apparel',
  'Electronics',
  'Home',
  'Office',
  'Grocery'
];

// GET ALLOWED FIELDS ONLY
function pick(body = {}) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return {};
  }

  return Object.fromEntries(
    fields
      .filter((key) =>
        Object.prototype.hasOwnProperty.call(body, key)
      )
      .map((key) => [key, body[key]])
  );
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
      'SKU already exists or another unique value is duplicated.'
    );
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');

    return sendError(res, 400, message);
  }

  if (error.name === 'CastError') {
    return sendError(res, 400, 'Invalid product data.');
  }

  console.error('Product error:', error);

  return sendError(
    res,
    500,
    'Unable to process product request.'
  );
}

// VALIDATE PRODUCT DATA
function validateProductData(data, isCreate = false) {
  const errors = [];

  if (isCreate || data.name !== undefined) {
    if (
      typeof data.name !== 'string' ||
      data.name.trim().length < 2 ||
      data.name.trim().length > 100
    ) {
      errors.push(
        'Product name must contain 2 to 100 characters.'
      );
    } else {
      data.name = data.name.trim();
    }
  }

  if (isCreate || data.sku !== undefined) {
    if (
      typeof data.sku !== 'string' ||
      !data.sku.trim() ||
      data.sku.trim().length > 40
    ) {
      errors.push(
        'SKU is required and must not exceed 40 characters.'
      );
    } else {
      data.sku = data.sku.trim().toUpperCase();
    }
  }

  if (isCreate || data.category !== undefined) {
    if (!validCategories.includes(data.category)) {
      errors.push('Please select a valid category.');
    }
  }

  for (const field of ['quantity', 'reorder']) {
    if (isCreate || data[field] !== undefined) {
      const raw = data[field];
      const number = Number(raw);

      if (
        raw === '' ||
        raw === null ||
        typeof raw === 'boolean' ||
        typeof raw === 'object' ||
        !Number.isSafeInteger(number) ||
        number < 0
      ) {
        errors.push(
          `${field} must be a non-negative whole number.`
        );
      } else {
        data[field] = number;
      }
    }
  }

  if (isCreate || data.price !== undefined) {
    const raw = data.price;
    const number = Number(raw);

    if (
      raw === '' ||
      raw === null ||
      typeof raw === 'boolean' ||
      typeof raw === 'object' ||
      !Number.isFinite(number) ||
      number < 0 ||
      !Number.isSafeInteger(Math.round(number * 100)) ||
      Math.abs(
        number * 100 - Math.round(number * 100)
      ) > 1e-7
    ) {
      errors.push(
        'Price must be a non-negative number with up to 2 decimal places.'
      );
    } else {
      data.price = number;
    }
  }

  if (isCreate || data.supplierId !== undefined) {
    const raw = data.supplierId;
    const number = Number(raw);

    if (
      raw === '' ||
      raw === null ||
      raw === undefined ||
      typeof raw === 'boolean' ||
      typeof raw === 'object' ||
      !Number.isSafeInteger(number) ||
      number < 1
    ) {
      errors.push('Please select a valid supplier.');
    } else {
      data.supplierId = number;
    }
  }

  return errors;
}

// CHECK SUPPLIER
async function supplierExists(supplierId) {
  const supplier = await Supplier.exists({
    supplierId: Number(supplierId)
  });

  return Boolean(supplier);
}

// CHECK DUPLICATE SKU
async function skuExists(sku, excludeId = null) {
  const query = {
    sku: sku.trim().toUpperCase()
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Boolean(await Product.exists(query));
}

// RECORD ACTIVITY SAFELY
async function recordActivity(kind, message) {
  try {
    await logActivity(kind, message);
  } catch (error) {
    console.error(
      'Activity logging failed:',
      error.message
    );
  }
}

// GET ALL PRODUCTS
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json(products);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// ADD PRODUCT
router.post('/', async (req, res) => {
  try {
    const data = pick(req.body);
    const errors = validateProductData(data, true);

    if (errors.length > 0) {
      return sendError(res, 400, errors.join(' '));
    }

    if (!(await supplierExists(data.supplierId))) {
      return sendError(
        res,
        400,
        'Selected supplier does not exist.'
      );
    }

    if (await skuExists(data.sku)) {
      return sendError(res, 409, 'SKU already exists.');
    }

    const product = await Product.create(data);

    await recordActivity(
      'new',
      `Added ${product.name} to inventory`
    );

    return res.status(201).json(product);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// ATOMIC STOCK ADJUSTMENT
router.patch('/:id/stock', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 400, 'Invalid product ID.');
  }

  const rawAmount = req.body?.amount;
  const amount = Number(rawAmount);

  if (
    rawAmount === undefined ||
    rawAmount === null ||
    rawAmount === '' ||
    typeof rawAmount === 'boolean' ||
    typeof rawAmount === 'object' ||
    !Number.isSafeInteger(amount) ||
    amount === 0
  ) {
    return sendError(
      res,
      400,
      'Stock adjustment must be a non-zero whole number.'
    );
  }

  try {
    const query = {
      _id: req.params.id,
      quantity: {
        $gte: Math.max(0, -amount),
        $lte:
          Number.MAX_SAFE_INTEGER - Math.max(0, amount)
      }
    };

    const product = await Product.findOneAndUpdate(
      query,
      {
        $inc: {
          quantity: amount
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const existing = await Product.findById(
        req.params.id
      );

      if (!existing) {
        return sendError(
          res,
          404,
          'Product not found.'
        );
      }

      if (amount < 0) {
        return sendError(
          res,
          409,
          'Not enough stock available.'
        );
      }

      return sendError(
        res,
        409,
        'Stock adjustment exceeds the allowed quantity.'
      );
    }

    if (amount > 0) {
      await recordActivity(
        'in',
        `Added ${amount} units to ${product.name}`
      );
    } else {
      await recordActivity(
        'out',
        `Removed ${Math.abs(amount)} units from ${product.name}`
      );
    }

    return res.json(product);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// UPDATE PRODUCT
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 400, 'Invalid product ID.');
  }

  try {
    const data = pick(req.body);

    if (Object.keys(data).length === 0) {
      return sendError(
        res,
        400,
        'Provide at least one field to update.'
      );
    }

    const errors = validateProductData(data);

    if (errors.length > 0) {
      return sendError(res, 400, errors.join(' '));
    }

    if (
      data.supplierId !== undefined &&
      !(await supplierExists(data.supplierId))
    ) {
      return sendError(
        res,
        400,
        'Selected supplier does not exist.'
      );
    }

    if (
      data.sku !== undefined &&
      await skuExists(data.sku, req.params.id)
    ) {
      return sendError(res, 409, 'SKU already exists.');
    }

    const oldProduct = await Product.findById(
      req.params.id
    );

    if (!oldProduct) {
      return sendError(res, 404, 'Product not found.');
    }

    // PREVENT STOCK CHANGES BETWEEN READ AND UPDATE.
    // This protects the update operation itself.
    // A future frontend update should also send the
    // quantity observed when the edit form was opened.
    const query = {
      _id: req.params.id
    };

    if (data.quantity !== undefined) {
      query.quantity = oldProduct.quantity;
    }

    const product = await Product.findOneAndUpdate(
      query,
      { $set: data },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const existing = await Product.exists({
        _id: req.params.id
      });

      if (!existing) {
        return sendError(
          res,
          404,
          'Product not found.'
        );
      }

      return sendError(
        res,
        409,
        'Product stock changed during the update. Please refresh and try again.'
      );
    }

    const difference =
      Number(product.quantity) -
      Number(oldProduct.quantity);

    if (difference > 0) {
      await recordActivity(
        'in',
        `Added ${difference} units to ${product.name}`
      );
    } else if (difference < 0) {
      await recordActivity(
        'out',
        `Removed ${Math.abs(difference)} units from ${product.name}`
      );
    } else {
      await recordActivity(
        'edit',
        `Updated product ${product.name}`
      );
    }

    return res.json(product);
  } catch (error) {
    return errorResponse(res, error);
  }
});

// DELETE PRODUCT
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(res, 400, 'Invalid product ID.');
  }

  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return sendError(res, 404, 'Product not found.');
    }

    const pendingOrder = await Order.findOne({
      product: product._id,
      status: 'Pending'
    });

    if (pendingOrder) {
      return sendError(
        res,
        409,
        'Cannot delete a product with pending purchase orders.'
      );
    }

    const deletedProduct =
      await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return sendError(
        res,
        404,
        'Product not found.'
      );
    }

    await recordActivity(
      'del',
      `Deleted product ${deletedProduct.name}`
    );

    return res.json({
      message: 'Product deleted successfully.'
    });
  } catch (error) {
    return errorResponse(res, error);
  }
});

module.exports = router;
