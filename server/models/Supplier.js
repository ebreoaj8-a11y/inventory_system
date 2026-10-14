
const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
      type: Number,
      required: [true, 'Supplier ID is required.'],
      unique: true,
      validate: {
        validator: function (value) {
          return Number.isSafeInteger(value) && value > 0;
        },
        message: 'Supplier ID must be a positive whole number.'
      }
    },

    name: {
      type: String,
      required: [true, 'Supplier name is required.'],
      trim: true,
      minlength: [2, 'Supplier name must have at least 2 characters.'],
      maxlength: [100, 'Supplier name cannot exceed 100 characters.']
    },

    contact: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Contact person cannot exceed 100 characters.']
    },

    email: {
      type: String,
      required: [true, 'Supplier email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [160, 'Email cannot exceed 160 characters.'],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Enter a valid email address.'
      ]
    },

    phone: {
      type: String,
      default: '',
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters.'],
      validate: {
        validator: function (value) {
          return (
            !value ||
            /^\+?[\d\s().-]{7,20}$/.test(value)
          );
        },
        message: 'Enter a valid phone number.'
      }
    },

    category: {
      type: String,
      required: [true, 'Supplier category is required.'],
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Supplier', supplierSchema);
