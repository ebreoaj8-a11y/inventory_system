
import axios from 'axios';

// BACKEND API URL
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// AXIOS CONFIGURATION
const api = axios.create({
  baseURL: `${API_URL}/api/orders`,
  timeout: 15000
});

// GET ALL ORDERS
export async function getOrders() {
  const response = await api.get('/');
  return response.data;
}

// CREATE ORDER
export async function createOrder(data) {
  const response = await api.post('/', data);
  return response.data;
}

// UPDATE PENDING ORDER QUANTITY
export async function updateOrder(id, quantity) {
  const response = await api.put(`/${id}`, {
    quantity
  });

  return response.data;
}

// RECEIVE ORDER
// Backend updates order status and product stock.
export async function receiveOrder(id) {
  const response = await api.patch(`/${id}/receive`);
  return response.data;
}

// CANCEL PENDING ORDER
export async function cancelOrder(id) {
  const response = await api.patch(`/${id}/cancel`);
  return response.data;
}

// DELETE CANCELLED ORDER
export async function deleteOrder(id) {
  const response = await api.delete(`/${id}`);
  return response.data;
}

// CONVERT MONGODB ORDER TO FRONTEND FORMAT
export function fromMongoOrder(order) {
  const productId =
    order.product &&
    typeof order.product === 'object'
      ? order.product._id
      : order.product;

  const orderId = String(order._id ?? '');

  return {
    ...order,
    id: orderId,
    number: `PO-${orderId.slice(-6).toUpperCase()}`,
    productId: String(productId ?? ''),
    supplierId: order.supplierId,
    createdAt: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-CA')
      : '',
    unitPrice: order.unitPrice,
    quantity: order.quantity
  };
}
