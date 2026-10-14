
import axios from 'axios';

// BACKEND API URL
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// AXIOS CONFIGURATION
const api = axios.create({
  baseURL: `${API_URL}/api/suppliers`,
  timeout: 15000
});

// GET ALL SUPPLIERS
export async function getSuppliers() {
  const response = await api.get('/');
  return response.data;
}

// ADD SUPPLIER
export async function addSupplier(supplier) {
  const response = await api.post('/', supplier);
  return response.data;
}

// UPDATE SUPPLIER
export async function updateSupplier(id, supplier) {
  const response = await api.put(`/${id}`, supplier);
  return response.data;
}

// DELETE SUPPLIER
export async function deleteSupplier(id) {
  const response = await api.delete(`/${id}`);
  return response.data;
}

// CONVERT MONGODB SUPPLIER TO FRONTEND FORMAT
export function fromMongoSupplier(supplier) {
  return {
    ...supplier,
    id: supplier.supplierId
  };
}
