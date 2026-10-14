
const express = require('express');
const mongoose = require('mongoose');

const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logActivity = require('../utils/logActivity');

const router = express.Router();

const allowedFields = [
  'name',
  'contact',
  'email',
  'phone',
  'category'
];

const validCategories = [
  'Apparel',
  'Electronics',
  'Home',
  'Office',
  'Grocery'
];

function cleanInput(body = {}) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return {};
  }

  return Object.fromEntries(
    allowedFields
      .filter((field) =>
        Object.prototype.hasOwnProperty.call(body, field)
      )
      .map((field) => [field, body[field]])
  );
}

function sendError(res, status, message) {
  return res.status(status).json({ message });
}

function handleError(res, error) {
  if (error.code === 11000) {
    return sendError(
      res,
      409,
      'Supplier ID or email already exists.'
    );
  }

  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(' ');

    return sendError(res, 400, message);
  }

  if (error.name === 'CastError') {
    return sendError(res, 400, 'Invalid supplier data.');
  }

  console.error('Supplier route error:', error);

  return sendError(
    res,
    500,
    'Unable to process supplier request.'
  );
}

function validateSupplier(data, isCreate = false) {
  const errors = [];

  if (isCreate || data.name !== undefined) {
    if (
      typeof data.name !== 'string' ||
      data.name.trim().length < 2 ||
      data.name.trim().length > 100
    ) {
      errors.push(
        'Supplier name must contain 2 to 100 characters.'
      );
    } else {
      data.name = data.name.trim();
    }
  }

  if (isCreate || data.contact !== undefined) {
    if (
      typeof data.contact !== 'string' ||
      data.contact.trim().length > 100
    ) {
      errors.push(
        'Contact person must not exceed 100 characters.'
      );
    } else {
      data.contact = data.contact.trim();
    }
  }

  if (isCreate || data.email !== undefined) {
    if (
      typeof data.email !== 'string' ||
      data.email.trim().length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
    ) {
      errors.push('Enter a valid email address.');
    } else {
      data.email = data.email.trim().toLowerCase();
    }
  }

  if (isCreate || data.phone !== undefined) {
    if (
      typeof data.phone !== 'string' ||
      data.phone.trim().length > 30 ||
      (
        data.phone.trim() &&
        !/^\+?[\d\s().-]{7,20}$/.test(data.phone.trim())
      )
    ) {
      errors.push('Enter a valid phone number.');
    } else {
      data.phone = data.phone.trim();
    }
  }

  if (isCreate || data.category !== undefined) {
    if (!validCategories.includes(data.category)) {
      errors.push('Please select a valid category.');
    }
  }

  return errors;
}

async function emailExists(email, excludeId = null) {
  const query = { email };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Boolean(await Supplier.exists(query));
}

async function recordActivity(kind, message) {
  try {
    await logActivity(kind, message);
  } catch (error) {
    console.error('Activity logging failed:', error);
  }
}

// GET ALL SUPPLIERS
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({
      name: 1
    });

    return res.json(suppliers);
  } catch (error) {
    return handleError(res, error);
  }
});

// ADD SUPPLIER
router.post('/', async (req, res) => {
  try {
    const data = cleanInput(req.body);

    // Optional fields can be omitted during creation.
    if (data.contact === undefined) data.contact = '';
    if (data.phone === undefined) data.phone = '';

    const errors = validateSupplier(data, true);

    if (errors.length > 0) {
      return sendError(res, 400, errors.join(' '));
    }

    if (await emailExists(data.email)) {
      return sendError(
        res,
        409,
        'Supplier email already exists.'
      );
    }

    // Preserve the numeric supplierId used by products
    // and orders in the existing Stockroom system.
    // Retry when simultaneous requests select the same ID.
    let supplier = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const latest = await Supplier.findOne()
        .sort({ supplierId: -1 })
        .select('supplierId');

      const supplierId = latest
        ? latest.supplierId + 1
        : 1;

      try {
        supplier = await Supplier.create({
          ...data,
          supplierId
        });

        break;
      } catch (error) {
        const duplicateId =
          error.code === 11000 &&
          (
            error.keyPattern?.supplierId ||
            error.keyValue?.supplierId !== undefined
          );

        if (!duplicateId) {
          throw error;
        }
      }
    }

    if (!supplier) {
      return sendError(
        res,
        409,
        'Unable to allocate a supplier ID. Please try again.'
      );
    }

    await recordActivity(
      'new',
      `Added supplier ${supplier.name}`
    );

    return res.status(201).json(supplier);
  } catch (error) {
    return handleError(res, error);
  }
});

// UPDATE SUPPLIER
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(
      res,
      400,
      'Invalid supplier ID.'
    );
  }

  try {
    const data = cleanInput(req.body);

    if (Object.keys(data).length === 0) {
      return sendError(
        res,
        400,
        'Provide at least one supplier field to update.'
      );
    }

    const errors = validateSupplier(data);

    if (errors.length > 0) {
      return sendError(res, 400, errors.join(' '));
    }

    if (
      data.email !== undefined &&
      await emailExists(data.email, req.params.id)
    ) {
      return sendError(
        res,
        409,
        'Supplier email already exists.'
      );
    }

    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      {
        new: true,
        runValidators: true
      }
    );

    if (!supplier) {
      return sendError(
        res,
        404,
        'Supplier not found.'
      );
    }

    await recordActivity(
      'edit',
      `Updated supplier ${supplier.name}`
    );

    return res.json(supplier);
  } catch (error) {
    return handleError(res, error);
  }
});

// DELETE SUPPLIER
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendError(
      res,
      400,
      'Invalid supplier ID.'
    );
  }

  try {
    const supplier = await Supplier.findById(
      req.params.id
    );

    if (!supplier) {
      return sendError(
        res,
        404,
        'Supplier not found.'
      );
    }

    // Product.supplierId is a numeric reference.
    const linkedProducts = await Product.countDocuments({
      supplierId: supplier.supplierId
    });

    if (linkedProducts > 0) {
      return sendError(
        res,
        409,
        'Cannot delete supplier because products are assigned to it.'
      );
    }

    // Order.supplierId is also a numeric reference.
    const pendingOrders = await Order.countDocuments({
      supplierId: supplier.supplierId,
      status: 'Pending'
    });

    if (pendingOrders > 0) {
      return sendError(
        res,
        409,
        'Cannot delete supplier because it has pending purchase orders.'
      );
    }

    const deletedSupplier = await Supplier.findByIdAndDelete(
      req.params.id
    );

    if (!deletedSupplier) {
      return sendError(
        res,
        404,
        'Supplier not found.'
      );
    }

    await recordActivity(
      'del',
      `Deleted supplier ${deletedSupplier.name}`
    );

    return res.json({
      message: 'Supplier deleted successfully.'
    });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
