
import { useRef, useState } from 'react';

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP'
});

const numbers = new Intl.NumberFormat('en-PH');

function getError(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong.'
  );
}

function getId(item) {
  return String(item?._id ?? item?.id ?? '');
}

function getSupplierId(supplier) {
  return String(supplier?.id ?? supplier?._id ?? '');
}

function getValidQuantity(value) {
  const text = String(value).trim();

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const number = Number(text);

  if (!Number.isSafeInteger(number) || number < 1) {
    return null;
  }

  return number;
}

export default function OrdersMongoPage({
  orders = [],
  products = [],
  suppliers = [],
  loading = false,
  onCreate,
  onUpdate,
  onReceive,
  onCancel,
  onDelete
}) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState('');

  const requestLock = useRef(false);

  const isDisabled = busy || loading;

  const selectedProduct = products.find(
    (product) => getId(product) === productId
  );

  const selectedSupplier = suppliers.find(
    (supplier) =>
      getSupplierId(supplier) ===
      String(selectedProduct?.supplierId ?? '')
  );

  const editingOrder = orders.find(
    (order) => getId(order) === editingId
  );

  const filteredOrders = orders.filter(
    (order) =>
      statusFilter === 'All' ||
      order.status === statusFilter
  );

  const validPreviewQuantity = getValidQuantity(quantity);
  const previewQuantity = validPreviewQuantity ?? 0;

  const unitPrice = editingId !== null
    ? Number(editingOrder?.unitPrice ?? 0)
    : Number(selectedProduct?.price ?? 0);

  const estimatedTotal = unitPrice * previewQuantity;

  function clearMessages() {
    setNotice('');
    setError('');
  }

  function resetForm() {
    setProductId('');
    setQuantity('1');
    setEditingId(null);
    setFieldErrors({});
    setConfirm('');
  }

  function validateForm() {
    const nextErrors = {};

    const qty = getValidQuantity(quantity);

    if (qty === null) {
      nextErrors.quantity =
        'Enter a whole number greater than zero.';
    }

    if (editingId !== null) {
      if (!editingOrder) {
        nextErrors.productId =
          'The order being edited no longer exists.';
      } else if (editingOrder.status !== 'Pending') {
        nextErrors.productId =
          'Only pending orders can be edited.';
      }
    } else {
      if (!productId) {
        nextErrors.productId = 'Please choose a product.';
      } else if (!selectedProduct) {
        nextErrors.productId =
          'The selected product is no longer available.';
      } else if (!selectedSupplier) {
        nextErrors.productId =
          'Selected product has no active supplier.';
      }
    }

    return nextErrors;
  }

  async function submit(event) {
    event.preventDefault();

    if (requestLock.current || isDisabled) {
      return;
    }

    clearMessages();

    const nextErrors = validateForm();
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const qty = getValidQuantity(quantity);

    if (qty === null) {
      return;
    }

    requestLock.current = true;
    setBusy(true);
    setConfirm('');

    try {
      if (editingId !== null) {
        await onUpdate(editingId, qty);
        setNotice('Order updated successfully.');
      } else {
        await onCreate({
          productId,
          quantity: qty
        });

        setNotice('Purchase order created successfully.');
      }

      resetForm();
    } catch (err) {
      setError(getError(err));
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  }

  async function perform(action, order) {
    if (requestLock.current || isDisabled) {
      return;
    }

    clearMessages();

    const orderId = getId(order);
    const confirmationKey = `${action}:${orderId}`;

    if (action === 'Receive' || action === 'Cancel') {
      if (order.status !== 'Pending') {
        setError('Only pending orders can be changed.');
        setConfirm('');
        return;
      }
    }

    if (action === 'Delete' && order.status !== 'Cancelled') {
      setError('Only cancelled orders can be deleted.');
      setConfirm('');
      return;
    }

    if (confirm !== confirmationKey) {
      setConfirm(confirmationKey);
      setNotice(
        `Click ${action} again to confirm ${order.number}.`
      );
      return;
    }

    requestLock.current = true;
    setBusy(true);

    try {
      if (action === 'Receive') {
        await onReceive(orderId);
        setNotice('Order received. Inventory stock updated.');
      } else if (action === 'Cancel') {
        await onCancel(orderId);
        setNotice('Order cancelled.');
      } else if (action === 'Delete') {
        await onDelete(orderId);
        setNotice('Cancelled order deleted.');
      }

      if (editingId === orderId) {
        resetForm();
      }

      setConfirm('');
    } catch (err) {
      setError(getError(err));
      setConfirm('');
    } finally {
      requestLock.current = false;
      setBusy(false);
    }
  }

  function edit(order) {
    if (isDisabled) {
      return;
    }

    if (order.status !== 'Pending') {
      setError('Only pending orders can be edited.');
      return;
    }

    setEditingId(getId(order));
    setProductId(String(order.productId ?? ''));
    setQuantity(String(order.quantity));
    setFieldErrors({});
    setConfirm('');
    clearMessages();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  function changeProduct(event) {
    setProductId(event.target.value);

    setFieldErrors((previous) => ({
      ...previous,
      productId: ''
    }));

    setConfirm('');
    clearMessages();
  }

  function changeQuantity(event) {
    setQuantity(event.target.value);

    setFieldErrors((previous) => ({
      ...previous,
      quantity: ''
    }));

    setConfirm('');
    clearMessages();
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Orders</h1>
          <p>
            Create purchase orders and receive stock into inventory.
          </p>
        </div>
      </header>

      {error && (
        <div
          className="inline-notice error-notice"
          role="alert"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          className="inline-notice success-notice"
          role="status"
        >
          {notice}
        </div>
      )}

      <form
        aria-label="Purchase order form"
        className="panel add-form"
        onSubmit={submit}
        noValidate
      >
        <div className="panel-heading">
          <div>
            <h2>
              {editingId !== null
                ? 'Edit purchase order'
                : 'New purchase order'}
            </h2>

            <p>
              Orders are linked to the product's supplier.
            </p>
          </div>
        </div>

        <div className="form-grid order-form-grid">
          <div className="form-field">
            <label htmlFor="order-product">
              Product
            </label>

            <select
              id="order-product"
              value={productId}
              disabled={editingId !== null || isDisabled}
              onChange={changeProduct}
              aria-invalid={Boolean(fieldErrors.productId)}
              aria-describedby={
                fieldErrors.productId
                  ? 'order-product-error'
                  : undefined
              }
            >
              <option value="">
                Choose a product
              </option>

              {products.map((product) => (
                <option
                  key={getId(product)}
                  value={getId(product)}
                >
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>

            {fieldErrors.productId && (
              <span
                id="order-product-error"
                className="field-error"
              >
                {fieldErrors.productId}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="order-quantity">
              Order quantity
            </label>

            <input
              id="order-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              disabled={isDisabled}
              onChange={changeQuantity}
              aria-invalid={Boolean(fieldErrors.quantity)}
              aria-describedby={
                fieldErrors.quantity
                  ? 'order-quantity-error'
                  : undefined
              }
            />

            {fieldErrors.quantity && (
              <span
                id="order-quantity-error"
                className="field-error"
              >
                {fieldErrors.quantity}
              </span>
            )}
          </div>

          <div className="order-preview">
            <span>Supplier</span>

            <strong>
              {editingId !== null
                ? editingOrder?.supplierName ||
                  'Supplier unavailable'
                : selectedSupplier?.name ||
                  (selectedProduct
                    ? 'Supplier unavailable'
                    : 'Select a product')}
            </strong>

            <span>Estimated total</span>

            <strong>
              {money.format(
                Number.isFinite(estimatedTotal)
                  ? estimatedTotal
                  : 0
              )}
            </strong>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="primary-button save-button"
            type="submit"
            disabled={isDisabled}
          >
            {busy
              ? 'Processing...'
              : editingId !== null
                ? 'Save order changes'
                : 'Create purchase order'}
          </button>

          {editingId !== null && (
            <button
              className="secondary-button"
              type="button"
              disabled={isDisabled}
              onClick={() => {
                resetForm();
                clearMessages();
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section
        aria-label="Purchase orders"
        className="panel list-panel"
      >
        <div className="panel-heading">
          <div>
            <h2>Purchase orders</h2>
            <p>{orders.length} purchase orders</p>
          </div>

          <label className="compact-filter">
            Status

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option>All</option>
              <option>Pending</option>
              <option>Received</option>
              <option>Cancelled</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="empty-state">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <strong>No orders found</strong>
            <span>
              Create an order or change the status filter.
            </span>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table order-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const orderId = getId(order);

                  const product = products.find(
                    (item) =>
                      getId(item) ===
                      String(order.productId)
                  );

                  const supplier = suppliers.find(
                    (item) =>
                      getSupplierId(item) ===
                      String(order.supplierId ?? '')
                  );

                  const confirmationForOrder = (action) =>
                    confirm === `${action}:${orderId}`;

                  return (
                    <tr key={orderId}>
                      <td className="mono-cell">
                        {order.number}
                      </td>

                      <td>
                        {product?.name ||
                          order.productName ||
                          'Product removed'}

                        <span className="table-subtext">
                          {product?.sku || ''}
                        </span>
                      </td>

                      <td>
                        {order.supplierName ||
                          supplier?.name ||
                          'Supplier unavailable'}
                      </td>

                      <td>
                        {numbers.format(order.quantity)}
                      </td>

                      <td>
                        {money.format(
                          Number(order.totalAmount ?? 0)
                        )}
                      </td>

                      <td>
                        {order.createdAt}
                      </td>

                      <td>
                        <span
                          className={
                            `status-badge order-status ` +
                            String(order.status).toLowerCase()
                          }
                        >
                          {order.status}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          {order.status === 'Pending' && (
                            <>
                              <button
                                className="small-action"
                                type="button"
                                disabled={isDisabled}
                                onClick={() => edit(order)}
                              >
                                Edit
                              </button>

                              <button
                                className="small-action receive-action"
                                type="button"
                                disabled={isDisabled}
                                onClick={() =>
                                  perform('Receive', order)
                                }
                              >
                                {busy &&
                                confirmationForOrder('Receive')
                                  ? 'Processing...'
                                  : confirmationForOrder('Receive')
                                    ? 'Confirm receive'
                                    : 'Receive'}
                              </button>

                              <button
                                className="small-action"
                                type="button"
                                disabled={isDisabled}
                                onClick={() =>
                                  perform('Cancel', order)
                                }
                              >
                                {busy &&
                                confirmationForOrder('Cancel')
                                  ? 'Processing...'
                                  : confirmationForOrder('Cancel')
                                    ? 'Confirm cancel'
                                    : 'Cancel'}
                              </button>
                            </>
                          )}

                          {order.status === 'Cancelled' && (
                            <button
                              className="small-action"
                              type="button"
                              disabled={isDisabled}
                              onClick={() =>
                                perform('Delete', order)
                              }
                            >
                              {busy &&
                              confirmationForOrder('Delete')
                                ? 'Processing...'
                                : confirmationForOrder('Delete')
                                  ? 'Confirm delete'
                                  : 'Delete'}
                            </button>
                          )}

                          {order.status === 'Received' && (
                            <span className="muted-text">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
