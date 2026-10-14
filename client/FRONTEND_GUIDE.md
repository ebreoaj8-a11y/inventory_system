
# Stockroom — Frontend Setup and User Guide

## 1. Overview

Stockroom is an inventory management system developed using React and Vite.

The frontend provides an interface for managing products, suppliers, orders, inventory reports, and recent activities.

## 2. Technologies Used

- React
- Vite
- JavaScript
- CSS
- Axios
- React Hooks

## 3. Requirements

Before running the frontend, install:

- Node.js
- npm

The backend server and MongoDB connection must also be configured for the system to retrieve and update data.

## 4. Installation

Open a terminal in the project root.

Navigate to the frontend folder:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local address displayed by Vite, usually:

http://localhost:5173

## 5. Environment Configuration

The frontend uses the following optional environment variable:

```env
VITE_API_URL=http://localhost:5000
```

Create `client/.env` only if you need to override the default backend URL.

Refer to `client/.env.example` for the sample configuration.

Do not place passwords, database credentials, or private API keys in frontend environment variables.

## 6. Main Features

### Dashboard

Displays inventory information and summaries, including stock status, orders, and recent activities.

### Inventory Management

Allows users to:

- View available products
- Add products
- Edit product information
- Adjust stock quantities
- Delete products when permitted

### Supplier Management

Allows users to:

- View suppliers
- Add supplier information
- Update supplier records
- Delete suppliers when permitted

### Order Management

Allows users to:

- Create purchase orders
- View existing orders
- Update pending order quantities
- Receive orders
- Cancel orders
- Delete cancelled orders when permitted

Receiving an order updates the corresponding product inventory through the backend.

### Reports

Provides inventory-related information to help users monitor products and stock levels.

### Recent Activity

Displays recorded actions, such as product updates, stock adjustments, and order operations.

## 7. Data Storage

Stockroom stores its main inventory data in MongoDB through the Express backend.

The frontend communicates with the backend using Axios API requests.

Some interface settings may be stored in the browser's localStorage.

## 8. Common Troubleshooting

### Frontend does not start

- Check that Node.js and npm are installed.
- Run `npm install` inside the `client` folder.
- Check the terminal for errors.

### Products or orders do not load

- Make sure the backend server is running.
- Verify that MongoDB is connected.
- Check the backend URL.
- Inspect browser developer tools for API errors.

### Changes do not appear

- Check the internet or local server connection.
- Refresh the data after a successful operation.
- Verify the backend response.

## 9. Production Build

To check whether the frontend builds successfully:

```bash
npm run build
```

Vite generates the production output in the `dist` folder.

The `dist` folder should not be committed to GitHub.

## 10. Security Reminders

- Do not commit real `.env` files.
- Never expose database credentials in React code.
- Use `.env.example` for configuration guidance.
- Validate important operations on the backend.
- Avoid storing sensitive information in localStorage.

## 11. Conclusion

The Stockroom frontend provides a responsive interface for managing inventory, suppliers, and purchase orders.

It communicates with the backend to retrieve records, perform updates, and display relevant inventory information.
