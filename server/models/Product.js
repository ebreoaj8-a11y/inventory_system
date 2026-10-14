
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      minlength: [2, 'Product name must have at least 2 characters.'],
      maxlength: [100, 'Product name cannot exceed 100 characters.']
    },

    sku: {
      type: String,
      required: [true, 'SKU is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [40, 'SKU cannot exceed 40 characters.']
    },

    category: {
      type: String,
      required: [true, 'Category is required.'],
      enum: {
        values: [
          'Apparel',
          'Electronics',
          'Home',
          'Office',
          'Grocery'
        ],
        message: 'Please select a valid category.'
      }
    },

    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative.'],
      validate: {
        validator: Number.isSafeInteger,
        message: 'Quantity must be a non-negative whole number.'
      }
    },

    reorder: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative.'],
      validate: {
        validator: Number.isSafeInteger,
        message: 'Reorder level must be a non-negative whole number.'
      }
    },

    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: [0, 'Price cannot be negative.'],
      validate: {
        validator: function (value) {
          return (
            typeof value === 'number' &&
            Number.isFinite(value) &&
            Number.isSafeInteger(Math.round(value * 100)) &&
            Math.abs(
              value * 100 - Math.round(value * 100)
            ) < 1e-7
          );
        },
        message: 'Price must have at most 2 decimal places.'
      }
    },

    supplierId: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          return (
            value === null ||
            (
              Number.isSafeInteger(value) &&
              value > 0
            )
          );
        },
        message: 'Supplier ID must be a positive whole number.'
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);
