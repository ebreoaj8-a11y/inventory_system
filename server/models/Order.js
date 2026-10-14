
const mongoose = require('mongoose');

function validMoney(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    Number.isSafeInteger(Math.round(value * 100)) &&
    Math.abs(
      value * 100 - Math.round(value * 100)
    ) < 1e-7
  );
}

const orderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required.']
    },

    supplierId: {
      type: Number,
      required: [true, 'Supplier is required.'],
      validate: {
        validator: function (value) {
          return Number.isSafeInteger(value) && value > 0;
        },
        message: 'Supplier ID must be a positive whole number.'
      }
    },

    quantity: {
      type: Number,
      required: [true, 'Order quantity is required.'],
      min: [1, 'Order quantity must be at least 1.'],
      validate: {
        validator: Number.isSafeInteger,
        message: 'Order quantity must be a whole number.'
      }
    },

    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required.'],
      min: [0, 'Unit price cannot be negative.'],
      validate: {
        validator: validMoney,
        message: 'Unit price must have at most 2 decimal places.'
      }
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required.'],
      min: [0, 'Total amount cannot be negative.'],
      validate: {
        validator: validMoney,
        message: 'Total amount must have at most 2 decimal places.'
      }
    },

    productName: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      minlength: [2, 'Product name must have at least 2 characters.'],
      maxlength: [100, 'Product name cannot exceed 100 characters.']
    },

    supplierName: {
      type: String,
      required: [true, 'Supplier name is required.'],
      trim: true,
      minlength: [2, 'Supplier name must have at least 2 characters.'],
      maxlength: [100, 'Supplier name cannot exceed 100 characters.']
    },

    status: {
      type: String,
      enum: {
        values: ['Pending', 'Received', 'Cancelled'],
        message: 'Invalid order status.'
      },
      default: 'Pending'
    },

    receivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
