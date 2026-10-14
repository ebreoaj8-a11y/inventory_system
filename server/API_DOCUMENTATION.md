
# Stockroom — Backend API Documentation

## Overview

Stockroom uses Node.js, Express, and MongoDB through Mongoose. The backend manages products, suppliers, orders, and activity logs.

## Local Configuration

The backend runs on port 5000 by default.

Configure the following variables in `server/.env`:

- `PORT`
- `MONGO_URI`
- `CLIENT_URL`

Never commit real credentials. Refer to `server/.env.example` for sample values.

## Base URL

`http://localhost:5000`

## Product Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Retrieve products |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/:id` | Update a product |
| PATCH | `/api/products/:id/stock` | Adjust stock quantity |
| DELETE | `/api/products/:id` | Delete a product when allowed |

## Supplier Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/suppliers` | Retrieve suppliers |
| POST | `/api/suppliers` | Create a supplier |
| PUT | `/api/suppliers/:id` | Update a supplier |
| DELETE | `/api/suppliers/:id` | Delete a supplier when allowed |

## Order Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Retrieve orders |
| POST | `/api/orders` | Create an order |
| PUT | `/api/orders/:id` | Update pending order quantity |
| PATCH | `/api/orders/:id/receive` | Receive an order and increase stock |
| PATCH | `/api/orders/:id/cancel` | Cancel an order |
| DELETE | `/api/orders/:id` | Delete a cancelled order when allowed |

## Activity Endpoint

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/activity` | Retrieve activity logs |

## Order Statuses

- **Pending** — Order created but not yet received.
- **Received** — Order received and stock updated.
- **Cancelled** — Order cancelled.

## Validation and Error Handling

The backend validates required fields, quantities, prices, and supported order status transitions.

Depending on the endpoint, API errors may include:

- `400` — Invalid request or validation error
- `404` — Resource not found
- `409` — Conflict with an existing record or operation
- `500` — Unexpected server error

## Security Notes

- Keep database credentials in `.env`.
- Do not commit `node_modules` or generated build files.
- Use `.env.example` for setup guidance.
- Never store secret keys in frontend `VITE_` variables.

## Testing

Verify the following operations:

- Product creation, editing, and deletion
- Supplier creation and editing
- Stock adjustments
- Order creation and receiving
- Order cancellation
- Invalid input handling
- Activity logging

Invalid requests should not unexpectedly change inventory.
  