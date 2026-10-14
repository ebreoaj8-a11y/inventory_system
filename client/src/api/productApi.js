
import axios from 'axios'

// BACKEND API URL
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

// AXIOS CONFIGURATION
const api = axios.create({
  baseURL: `${API_URL}/api/products`,
  timeout: 15000
})

// GET ALL PRODUCTS
export const getProducts = async () => {
  const response = await api.get('/')
  return response.data
}

// ADD PRODUCT
export const addProduct = async (product) => {
  const response = await api.post('/', product)
  return response.data
}

// UPDATE PRODUCT
export const updateProduct = async (id, product) => {
  const response = await api.put(`/${id}`, product)
  return response.data
}

// DELETE PRODUCT
export const deleteProduct = async (id) => {
  const response = await api.delete(`/${id}`)
  return response.data
}

// ATOMIC STOCK ADJUSTMENT
// Positive amount = Stock In
// Negative amount = Stock Out
export const adjustProductStock = async (id, amount) => {
  const response = await api.patch(`/${id}/stock`, {
    amount
  })

  return response.data
}

// CONVERT FRONTEND PRODUCT TO MONGODB FORMAT
export const toMongoProduct = (product) => ({
  name: product.name,
  sku: product.sku,
  category: product.category,
  quantity: product.qty,
  reorder: product.reorder,
  price: product.price,
  supplierId: product.supplierId ?? null
})

// CONVERT MONGODB PRODUCT TO FRONTEND FORMAT
export const fromMongoProduct = (product) => ({
  ...product,
  id: product._id,
  qty: product.quantity,
  reorder: product.reorder ?? 10,
  supplierId: product.supplierId ?? null
})
