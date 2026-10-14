import { useMemo, useState } from "react";

import InventoryTable from "./InventoryTable";

import { categories } from "./store";

const numberFormat = new Intl.NumberFormat("en-PH");

const moneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",

  currency: "PHP",

  maximumFractionDigits: 0,
});

function formatNumber(value) {
  return numberFormat.format(value);
}

function statusOf(product) {
  if (product.qty <= 0) return "Out of stock";

  if (product.qty <= product.reorder) return "Low stock";

  return "In stock";
}

function statusColors(status) {
  if (status === "Out of stock")
    return { bg: "#FBDDDB", fg: "#8F1D17", bar: "#C0392B" };

  if (status === "Low stock")
    return { bg: "#FCEFC7", fg: "#7A4B00", bar: "#C98A00" };

  return { bg: "#DDF3E8", fg: "#0B5B3E", bar: "#0E6B57" };
}

function PageHeading({ action, description, title }) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      {action}
    </header>
  );
}

function PanelTitle({ children, description, action }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{children}</h2>

        {description && <p>{description}</p>}
      </div>

      {action}
    </div>
  );
}

function SummaryCard({ alert = false, icon, label, note, value }) {
  return (
    <article className="summary-card">
      <div className="summary-label">
        <div className={`summary-icon${alert ? " alert-icon" : ""}`}>
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
          >
            <path d={icon} />
          </svg>
        </div>

        <span>{label}</span>
      </div>

      <div className={`summary-value${alert ? " alert-value" : ""}`}>
        {value}
      </div>

      <div className="summary-note">{note}</div>
    </article>
  );
}

function EmptyState({ children, title }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>

      <span>{children}</span>
    </div>
  );
}

function Field({ children, error, htmlFor, label, hint }) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>

      {children}

      {hint && !error && <span className="field-hint">{hint}</span>}

      {error && (
        <span className="field-error" id={`${htmlFor}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

function inputProps(error, id) {
  return {
    "aria-describedby": error ? `${id}-error` : undefined,

    "aria-invalid": error ? "true" : undefined,

    id,
  };
}

function ActivityList({ activity, limit = 5 }) {
  return (
    <div className="activity-list">
      {activity.slice(0, limit).map((event) => (
        <div className="activity-event" key={event.id}>
          <span className={`activity-dot ${event.kind}`} />

          <div>
            <div className="activity-text">{event.text}</div>

            <div className="activity-time">{event.time}</div>
          </div>
        </div>
      ))}

      {activity.length === 0 && (
        <div className="muted-text">No activity recorded yet.</div>
      )}
    </div>
  );
}

export function DashboardPage({ state, onOpenInventory, onAdjust, onDelete }) {
  const [dashboardError, setDashboardError] = useState("");
  const [restockingId, setRestockingId] = useState(null);

  async function handleRestock(product, amount) {
    if (restockingId !== null) return;
    setDashboardError("");
    setRestockingId(product.id);
    try {
      const message = await onAdjust(product, amount);
      if (message) setDashboardError(message);
    } catch (error) {
      setDashboardError(
        error.response?.data?.message ||
          error.message ||
          "Unable to restock product.",
      );
    } finally {
      setRestockingId(null);
    }
  }

  async function handleDelete(product) {
    setDashboardError("");
    try {
      const message = await onDelete(product);
      if (message) setDashboardError(message);
      return message;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to delete product.";
      setDashboardError(message);
      return message;
    }
  }

  const stats = useMemo(() => {
    const units = state.products.reduce((total, item) => total + item.qty, 0);

    const alerts = state.products.filter(
      (item) => statusOf(item) !== "In stock",
    );

    const out = alerts.filter((item) => item.qty === 0).length;

    const value = state.products.reduce(
      (total, item) => total + item.qty * item.price,

      0,
    );

    const categoryRows = categories.map((name) => {
      const products = state.products.filter((item) => item.category === name);

      return {
        name,

        units: products.reduce((total, item) => total + item.qty, 0),

        alerts: products.filter((item) => statusOf(item) !== "In stock").length,
      };
    });

    const maxUnits = Math.max(1, ...categoryRows.map((item) => item.units));

    return {
      units,

      alerts,

      out,

      value,

      categoryRows: categoryRows.map((item) => ({
        ...item,

        pct: Math.round((item.units / maxUnits) * 100),
      })),
    };
  }, [state.products]);

  const alertProducts = [...stats.alerts].sort((a, b) => a.qty - b.qty);

  const inventoryActions = {
    onAdjust,
    onDelete: handleDelete,
    onEdit: onOpenInventory,
    pendingOrderProductIds: state.orders
      .filter((order) => order.status === "Pending")
      .map((order) => order.productId),
  };

  return (
    <>
      {dashboardError && (
        <div className="inline-notice error-notice" role="alert">
          {dashboardError}
        </div>
      )}
      <PageHeading
        description="Track stock levels, spot shortages, and restock in one place."
        title="Inventory overview"
      />

      <section aria-label="Summary" className="summary-grid">
        <SummaryCard
          icon="M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8"
          label="Products"
          value={formatNumber(state.products.length)}
          note={`Across ${categories.length} categories`}
        />

        <SummaryCard
          icon="M3 3h18v4H3z M5 7v14h14V7 M10 12h4"
          label="Units on hand"
          value={formatNumber(stats.units)}
          note={`About ${formatNumber(Math.round(stats.units / Math.max(1, state.products.length)))} per product`}
        />

        <SummaryCard
          alert
          icon="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z M12 9v4 M12 17h.01"
          label="Need restock"
          value={String(stats.alerts.length)}
          note={`${stats.out} ${stats.out === 1 ? "product is" : "products are"} out of stock`}
        />

        <SummaryCard
          icon="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
          label="Stock value"
          value={moneyFormat.format(stats.value)}
          note="At current unit prices"
        />
      </section>

      <div className="insights-grid dashboard-insights">
        <section aria-label="Reorder alerts" className="panel insight-panel">
          <PanelTitle
            action={
              <span className="alert-total">{stats.alerts.length} items</span>
            }
            description="Lowest stock first."
          >
            Reorder alerts
          </PanelTitle>

          {alertProducts.length === 0 ? (
            <EmptyState title="All clear">
              Everything is above its reorder level.
            </EmptyState>
          ) : (
            <>
              {alertProducts.slice(0, 3).map((product) => {
                const color = statusColors(statusOf(product));

                const amount = Math.max(1, product.reorder * 2);

                return (
                  <div className="alert-item" key={product.id}>
                    <div className="alert-item-heading">
                      <div className="alert-product">
                        <div className="product-name">{product.name}</div>

                        <div className="sku">{product.sku}</div>
                      </div>

                      <span
                        className="stock-left"
                        style={{ backgroundColor: color.bg, color: color.fg }}
                      >
                        {product.qty} left
                      </span>
                    </div>

                    <button
                      className="restock-button"
                      onClick={() => handleRestock(product, amount)}
                      disabled={restockingId !== null}
                      type="button"
                    >
                      {restockingId === product.id
                        ? "Restocking..."
                        : `Restock +${amount} units`}
                    </button>
                  </div>
                );
              })}

              {alertProducts.length > 3 && (
                <div className="more-alerts">
                  +{alertProducts.length - 3} more below their reorder level
                </div>
              )}
            </>
          )}
        </section>

        <section aria-label="Stock by category" className="panel insight-panel">
          <PanelTitle description="Units on hand in each category.">
            Stock by category
          </PanelTitle>

          {stats.categoryRows.map((item) => (
            <div className="category-row" key={item.name}>
              <div className="category-labels">
                <strong>{item.name}</strong>

                <span>{formatNumber(item.units)} units</span>
              </div>

              <div className="category-track">
                <span style={{ width: `${item.pct}%` }} />
              </div>

              <div
                className={`category-note${item.alerts ? " needs-restock" : ""}`}
              >
                {item.alerts
                  ? `${item.alerts} ${item.alerts === 1 ? "item needs" : "items need"} restock`
                  : "All items healthy"}
              </div>
            </div>
          ))}
        </section>

        <section
          aria-label="Recent activity"
          className="panel insight-panel activity-panel"
        >
          <PanelTitle
            description={
              state.settings.dailyDigest
                ? "Updates as you change stock."
                : "Activity digest is turned off in Settings."
            }
          >
            Recent activity
          </PanelTitle>

          {state.settings.dailyDigest ? (
            <ActivityList activity={state.activity} limit={5} />
          ) : (
            <div className="muted-text">
              Turn on the daily inventory digest to show recent changes here.
            </div>
          )}
        </section>
      </div>

      <InventoryTable
        {...inventoryActions}
        products={state.products}
        suppliers={state.suppliers}
      />
    </>
  );
}

function makeProductForm(product, state) {
  const fallbackSupplier =
    state.suppliers.find((supplier) => supplier.category === product?.category)
      ?.id ??
    state.suppliers[0]?.id ??
    "";

  return {
    name: product?.name ?? "",

    sku: product?.sku ?? "",

    category: product?.category ?? categories[0],

    supplierId: String(product?.supplierId ?? fallbackSupplier),

    qty: String(product?.qty ?? 0),

    reorder: String(product?.reorder ?? state.settings.defaultReorder),

    price: String(product?.price ?? 0),
  };
}

function validateProduct(form, state, editingId = null) {
  const errors = {};

  const name = form.name.trim();

  const sku = form.sku.trim().toUpperCase();

  if (!name) errors.name = "Enter a product name.";
  else if (name.length < 2) errors.name = "Use at least 2 characters.";
  else if (name.length > 100) errors.name = "Use 100 characters or fewer.";

  if (!sku && !state.settings.autoSku) errors.sku = "Enter a SKU.";
  else if (sku.length > 40) errors.sku = "Use 40 characters or fewer.";
  else if (
    sku &&
    state.products.some(
      (product) =>
        String(product.id) !== String(editingId) &&
        String(product.sku).trim().toUpperCase() === sku,
    )
  )
    errors.sku = "This SKU is already in use.";

  if (!categories.includes(form.category))
    errors.category = "Choose a valid category.";

  if (
    !form.supplierId ||
    !state.suppliers.some(
      (supplier) => String(supplier.id) === String(form.supplierId),
    )
  )
    errors.supplierId = "Choose an active supplier.";

  for (const key of ["qty", "reorder", "price"]) {
    const raw = String(form[key]).trim();

    const value = Number(raw);

    if (!raw || !Number.isFinite(value) || value < 0) {
      errors[key] = "Enter a non-negative number.";
    } else if (key !== "price" && !Number.isSafeInteger(value)) {
      errors[key] = "Enter a whole number.";
    } else if (key === "price" && Math.round(value * 100) / 100 !== value) {
      errors[key] = "Use no more than 2 decimal places.";
    }
  }

  return errors;
}

function ProductForm({ editing, onCancel, onSave, state }) {
  const [form, setForm] = useState(() => makeProductForm(editing, state));

  const [errors, setErrors] = useState({});

  const [submitError, setSubmitError] = useState("");

  const [saving, setSaving] = useState(false);

  function change(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));

    setErrors((current) => ({ ...current, [name]: undefined }));

    setSubmitError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (saving) return;

    const nextErrors = validateProduct(form, state, editing?.id);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      return;
    }

    let sku = form.sku.trim().toUpperCase();

    if (!sku) {
      let candidateId = state.nextProductId || 1;

      do {
        sku = `${form.category.slice(0, 3).toUpperCase()}-${String(candidateId).padStart(4, "0")}`;

        candidateId += 1;
      } while (
        state.products.some((product) => product.sku.toUpperCase() === sku)
      );
    }

    const saved = {
      ...(editing || {}),

      name: form.name.trim(),

      sku,

      category: form.category,

      supplierId: Number(form.supplierId),

      qty: Number(form.qty),

      reorder: Number(form.reorder),

      price: Number(form.price),
    };

    setSaving(true);

    setSubmitError("");

    try {
      const message = await onSave(saved, editing?.id);

      if (message) {
        setSubmitError(message);
      }
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save product.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      aria-label={editing ? "Edit product" : "Add product"}
      className="panel add-form"
      noValidate
      onSubmit={submit}
    >
      <PanelTitle description="Product details and reorder settings.">
        {editing ? "Edit product" : "New product"}
      </PanelTitle>

      <div className="form-grid">
        <Field error={errors.name} htmlFor="product-name" label="Product name">
          <input
            {...inputProps(errors.name, "product-name")}
            autoComplete="off"
            maxLength={100}
            name="name"
            onChange={change}
            placeholder="e.g. Canvas Tote Bag"
            value={form.name}
          />
        </Field>

        <Field
          error={errors.sku}
          hint={
            state.settings.autoSku
              ? "Leave blank to generate a SKU automatically."
              : undefined
          }
          htmlFor="product-sku"
          label="SKU"
        >
          <input
            {...inputProps(errors.sku, "product-sku")}
            autoComplete="off"
            maxLength={40}
            name="sku"
            onChange={change}
            placeholder={
              state.settings.autoSku ? "Auto-generated" : "Enter a unique SKU"
            }
            value={form.sku}
          />
        </Field>

        <Field
          error={errors.category}
          htmlFor="product-category"
          label="Category"
        >
          <select
            {...inputProps(errors.category, "product-category")}
            name="category"
            onChange={change}
            value={form.category}
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>

        <Field
          error={errors.supplierId}
          htmlFor="product-supplier"
          label="Supplier"
        >
          <select
            {...inputProps(errors.supplierId, "product-supplier")}
            name="supplierId"
            onChange={change}
            value={form.supplierId}
          >
            <option value="">Choose a supplier</option>

            {state.suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </Field>

        <Field error={errors.qty} htmlFor="product-qty" label="Quantity">
          <input
            {...inputProps(errors.qty, "product-qty")}
            min="0"
            name="qty"
            onChange={change}
            step="1"
            type="number"
            value={form.qty}
          />
        </Field>

        <Field
          error={errors.reorder}
          htmlFor="product-reorder"
          label="Reorder level"
        >
          <input
            {...inputProps(errors.reorder, "product-reorder")}
            min="0"
            name="reorder"
            onChange={change}
            step="1"
            type="number"
            value={form.reorder}
          />
        </Field>

        <Field error={errors.price} htmlFor="product-price" label="Unit price">
          <input
            {...inputProps(errors.price, "product-price")}
            min="0"
            name="price"
            onChange={change}
            step="0.01"
            type="number"
            value={form.price}
          />
        </Field>
      </div>

      {submitError && (
        <div className="form-error form-submit-error" role="alert">
          {submitError}
        </div>
      )}

      <div className="form-actions">
        <button
          className="primary-button save-button"
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Save product"}
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function InventoryPage({
  state,

  onSave,

  onAdjust,

  onDelete,

  editingProduct,

  setEditingProduct,
}) {
  const [showForm, setShowForm] = useState(false);

  const [notice, setNotice] = useState("");

  async function saveProduct(product, editingId) {
    const message = await onSave(product, editingId);

    if (message) return message;

    setShowForm(false);

    setEditingProduct(null);

    setNotice("");

    return "";
  }

  async function deleteProduct(product) {
    const openOrder = state.orders.find(
      (order) => order.productId === product.id && order.status === "Pending",
    );

    if (openOrder) {
      setNotice(
        `Cannot delete ${product.name} while ${openOrder.number} is pending.`,
      );

      return;
    }

    const message = await onDelete(product);

    setNotice(message || "");
  }

  const formVisible = showForm || editingProduct;

  return (
    <>
      <PageHeading
        action={
          <button
            className="primary-button"
            onClick={() => {
              setEditingProduct(null);

              setShowForm((visible) => !visible);
            }}
            type="button"
          >
            {showForm ? "Close form" : "Add product"}
          </button>
        }
        description="Manage product details, supplier assignments, and stock levels."
        title="Inventory"
      />

      {formVisible && (
        <ProductForm
          editing={editingProduct}
          key={editingProduct?.id ?? "new"}
          onCancel={() => {
            setShowForm(false);

            setEditingProduct(null);
          }}
          onSave={saveProduct}
          state={state}
        />
      )}

      {notice && (
        <div className="inline-notice error-notice" role="alert">
          {notice}
        </div>
      )}

      <InventoryTable
        onAdjust={onAdjust}
        onDelete={deleteProduct}
        onEdit={(product) => {
          setShowForm(false);

          setEditingProduct(product);

          setNotice("");
        }}
        products={state.products}
        pendingOrderProductIds={state.orders

          .filter((order) => order.status === "Pending")

          .map((order) => order.productId)}
        suppliers={state.suppliers}
      />
    </>
  );
}

function orderStatusClass(status) {
  return `status-badge order-status ${status.toLowerCase()}`;
}

export function OrdersPage({ state, dispatch }) {
  const [productId, setProductId] = useState("");

  const [quantity, setQuantity] = useState("1");

  const [errors, setErrors] = useState({});

  const [notice, setNotice] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  // HTML select values and MongoDB ObjectIds are strings.  Keeping the map

  // keys as strings also preserves support for the numeric sample-product IDs.

  const productsById = new Map(
    state.products.map((product) => [String(product.id), product]),
  );

  const suppliersById = new Map(
    state.suppliers.map((supplier) => [supplier.id, supplier]),
  );

  const selectedProduct = productsById.get(productId);

  const orderValue = selectedProduct
    ? selectedProduct.price * Number(quantity || 0)
    : 0;

  const orders = state.orders.filter(
    (order) => statusFilter === "All" || order.status === statusFilter,
  );

  function createOrder(event) {
    event.preventDefault();

    const nextErrors = {};

    const product = productsById.get(productId);

    const qty = Number(quantity);

    if (!product) nextErrors.productId = "Choose an active product.";

    if (!Number.isInteger(qty) || qty <= 0)
      nextErrors.quantity = "Enter a whole number greater than zero.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    dispatch({
      type: "CREATE_ORDER",

      order: {
        productId: product.id,

        supplierId: product.supplierId,

        quantity: qty,
      },
    });

    setProductId("");

    setQuantity("1");

    setNotice(
      "Purchase order created. Inventory updates when the order is received.",
    );
  }

  return (
    <>
      <PageHeading
        description="Create purchase orders and receive stock into inventory."
        title="Orders"
      />

      {notice && (
        <div className="inline-notice success-notice" role="status">
          {notice}
        </div>
      )}

      <form
        aria-label="Create purchase order"
        className="panel add-form"
        noValidate
        onSubmit={createOrder}
      >
        <PanelTitle description="Orders are linked to a product’s assigned supplier.">
          New purchase order
        </PanelTitle>

        <div className="form-grid order-form-grid">
          <Field
            error={errors.productId}
            htmlFor="order-product"
            label="Product"
          >
            <select
              {...inputProps(errors.productId, "order-product")}
              onChange={(event) => {
                setProductId(event.target.value);

                setErrors((current) => ({ ...current, productId: undefined }));

                setNotice("");
              }}
              value={productId}
            >
              <option value="">Choose a product</option>

              {state.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </Field>

          <Field
            error={errors.quantity}
            htmlFor="order-quantity"
            label="Order quantity"
          >
            <input
              {...inputProps(errors.quantity, "order-quantity")}
              min="1"
              onChange={(event) => {
                setQuantity(event.target.value);

                setErrors((current) => ({ ...current, quantity: undefined }));

                setNotice("");
              }}
              step="1"
              type="number"
              value={quantity}
            />
          </Field>

          <div className="order-preview">
            <span>Supplier</span>

            <strong>
              {selectedProduct
                ? suppliersById.get(selectedProduct.supplierId)?.name ||
                  "Supplier unavailable"
                : "Select a product"}
            </strong>

            <span>Estimated total</span>

            <strong>{moneyFormat.format(orderValue)}</strong>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-button save-button" type="submit">
            Create purchase order
          </button>
        </div>
      </form>

      <section aria-label="Purchase orders" className="panel list-panel">
        <PanelTitle
          action={
            <label className="compact-filter">
              Status
              <select
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option>All</option>

                <option>Pending</option>

                <option>Received</option>

                <option>Cancelled</option>
              </select>
            </label>
          }
          description={`${state.orders.length} purchase orders`}
        >
          Purchase orders
        </PanelTitle>

        {orders.length === 0 ? (
          <EmptyState title="No orders found">
            Create an order or change the status filter.
          </EmptyState>
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
                {orders.map((order) => {
                  const product = productsById.get(order.productId);

                  const supplier = suppliersById.get(order.supplierId);

                  return (
                    <tr key={order.id}>
                      <td className="mono-cell">{order.number}</td>

                      <td>
                        {product?.name ||
                          order.productName ||
                          "Product removed"}

                        <span className="table-subtext">
                          {product?.sku || ""}
                        </span>
                      </td>

                      <td>
                        {supplier?.name ||
                          order.supplierName ||
                          "Supplier removed"}
                      </td>

                      <td>{formatNumber(order.quantity)}</td>

                      <td>
                        {moneyFormat.format(order.quantity * order.unitPrice)}
                      </td>

                      <td>{order.createdAt}</td>

                      <td>
                        <span className={orderStatusClass(order.status)}>
                          {order.status}
                        </span>
                      </td>

                      <td>
                        {order.status === "Pending" ? (
                          <div className="table-actions">
                            <button
                              className="small-action receive-action"
                              onClick={() =>
                                dispatch({
                                  type: "RECEIVE_ORDER",

                                  id: order.id,
                                })
                              }
                              type="button"
                            >
                              Receive
                            </button>

                            <button
                              className="small-action"
                              onClick={() =>
                                dispatch({ type: "CANCEL_ORDER", id: order.id })
                              }
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="muted-text">—</span>
                        )}
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

function blankSupplier() {
  return {
    name: "",

    contact: "",

    email: "",

    phone: "",

    category: categories[0],
  };
}

function validateSupplier(form, suppliers, editingId) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Enter a supplier name.";
  else if (form.name.trim().length > 100)
    errors.name = "Use 100 characters or fewer.";

  if (!form.email.trim()) errors.email = "Enter a contact email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address.";

  if (form.phone.trim() && !/^\+?[\d\s().-]{7,20}$/.test(form.phone.trim()))
    errors.phone = "Enter a valid phone number.";

  if (form.contact.trim().length > 100)
    errors.contact = "Use 100 characters or fewer.";

  if (
    suppliers.some(
      (supplier) =>
        supplier.id !== editingId &&
        supplier.email.toLowerCase() === form.email.trim().toLowerCase(),
    )
  )
    errors.email = "This email is already assigned to a supplier.";

  if (!categories.includes(form.category))
    errors.category = "Choose a valid category.";

  return errors;
}

export function SuppliersPage({ state, dispatch }) {
  const [form, setForm] = useState(blankSupplier);

  const [editingId, setEditingId] = useState(null);

  const [errors, setErrors] = useState({});

  const [notice, setNotice] = useState("");

  const [confirmId, setConfirmId] = useState(null);

  const suppliers = [...state.suppliers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({ ...current, [name]: value }));

    setErrors((current) => ({ ...current, [name]: undefined }));

    setNotice("");
  }

  function resetForm() {
    setForm(blankSupplier());

    setEditingId(null);

    setErrors({});

    setNotice("");
  }

  function submit(event) {
    event.preventDefault();

    const nextErrors = validateSupplier(form, state.suppliers, editingId);

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    const supplier = {
      ...form,

      name: form.name.trim(),

      contact: form.contact.trim(),

      email: form.email.trim().toLowerCase(),

      phone: form.phone.trim(),
    };

    if (editingId) {
      dispatch({
        type: "UPDATE_SUPPLIER",

        supplier: { ...supplier, id: editingId },
      });

      resetForm();

      setNotice("Supplier details updated.");
    } else {
      dispatch({ type: "CREATE_SUPPLIER", supplier });

      resetForm();

      setNotice("Supplier added.");
    }
  }

  function editSupplier(supplier) {
    setForm({
      name: supplier.name,

      contact: supplier.contact,

      email: supplier.email,

      phone: supplier.phone,

      category: supplier.category,
    });

    setEditingId(supplier.id);

    setConfirmId(null);

    setErrors({});

    setNotice("");

    document

      .getElementById("supplier-form")

      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function deleteSupplier(supplier) {
    const productCount = state.products.filter(
      (product) => product.supplierId === supplier.id,
    ).length;

    const pendingOrderCount = state.orders.filter(
      (order) => order.supplierId === supplier.id && order.status === "Pending",
    ).length;

    if (productCount || pendingOrderCount) {
      setNotice(
        `Cannot remove ${supplier.name}: it is linked to ${productCount} product(s) and ${pendingOrderCount} pending order(s). Reassign products or close pending orders first.`,
      );

      setConfirmId(null);

      return;
    }

    if (confirmId !== supplier.id) {
      setConfirmId(supplier.id);

      setNotice("Select Remove again to confirm.");

      return;
    }

    dispatch({ type: "DELETE_SUPPLIER", id: supplier.id });

    setConfirmId(null);

    setNotice(`${supplier.name} removed.`);
  }

  return (
    <>
      <PageHeading
        description="Maintain supplier contacts and the products they provide."
        title="Suppliers"
      />

      {notice && (
        <div
          className={`inline-notice ${notice.startsWith("Cannot") ? "error-notice" : "success-notice"}`}
          role={notice.startsWith("Cannot") ? "alert" : "status"}
        >
          {notice}
        </div>
      )}

      <form
        aria-label={editingId ? "Edit supplier" : "Add supplier"}
        className="panel add-form"
        id="supplier-form"
        noValidate
        onSubmit={submit}
      >
        <PanelTitle>{editingId ? "Edit supplier" : "Add supplier"}</PanelTitle>

        <div className="form-grid">
          <Field
            error={errors.name}
            htmlFor="supplier-name"
            label="Supplier name"
          >
            <input
              {...inputProps(errors.name, "supplier-name")}
              maxLength={100}
              name="name"
              onChange={updateForm}
              value={form.name}
            />
          </Field>

          <Field
            error={errors.contact}
            htmlFor="supplier-contact"
            label="Contact person"
          >
            <input
              {...inputProps(errors.contact, "supplier-contact")}
              maxLength={100}
              name="contact"
              onChange={updateForm}
              value={form.contact}
            />
          </Field>

          <Field error={errors.email} htmlFor="supplier-email" label="Email">
            <input
              {...inputProps(errors.email, "supplier-email")}
              autoComplete="email"
              maxLength={160}
              name="email"
              onChange={updateForm}
              type="email"
              value={form.email}
            />
          </Field>

          <Field
            error={errors.phone}
            htmlFor="supplier-phone"
            label="Phone (optional)"
          >
            <input
              {...inputProps(errors.phone, "supplier-phone")}
              autoComplete="tel"
              maxLength={30}
              name="phone"
              onChange={updateForm}
              type="tel"
              value={form.phone}
            />
          </Field>

          <Field
            error={errors.category}
            htmlFor="supplier-category"
            label="Primary category"
          >
            <select
              {...inputProps(errors.category, "supplier-category")}
              name="category"
              onChange={updateForm}
              value={form.category}
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="form-actions">
          <button className="primary-button save-button" type="submit">
            {editingId ? "Save supplier" : "Add supplier"}
          </button>

          {editingId && (
            <button
              className="secondary-button"
              onClick={resetForm}
              type="button"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section aria-label="Supplier directory" className="panel list-panel">
        <PanelTitle description={`${state.suppliers.length} suppliers`}>
          Supplier directory
        </PanelTitle>

        {suppliers.length === 0 ? (
          <EmptyState title="No suppliers yet">
            Add a supplier to connect products to their source.
          </EmptyState>
        ) : (
          <div className="supplier-grid">
            {suppliers.map((supplier) => {
              const linkedProducts = state.products.filter(
                (product) => product.supplierId === supplier.id,
              );

              const linkedOrders = state.orders.filter(
                (order) => order.supplierId === supplier.id,
              );

              const pendingOrders = linkedOrders.filter(
                (order) => order.status === "Pending",
              ).length;

              const protectedReferences = linkedProducts.length + pendingOrders;

              return (
                <article className="supplier-card" key={supplier.id}>
                  <div className="supplier-avatar">
                    {supplier.name

                      .split(/\s+/)

                      .slice(0, 2)

                      .map((part) => part[0])

                      .join("")

                      .toUpperCase()}
                  </div>

                  <div className="supplier-card-main">
                    <h3>{supplier.name}</h3>

                    <p>{supplier.contact || "No contact person"}</p>

                    <a href={`mailto:${supplier.email}`}>{supplier.email}</a>

                    <p>
                      {supplier.phone || "No phone number"} ·{" "}
                      {supplier.category}
                    </p>
                  </div>

                  <div className="supplier-card-stats">
                    <strong>{linkedProducts.length}</strong>

                    <span>products</span>

                    <strong>{linkedOrders.length}</strong>

                    <span>orders</span>
                  </div>

                  <div className="supplier-actions">
                    <button
                      className="secondary-button"
                      onClick={() => editSupplier(supplier)}
                      type="button"
                    >
                      Edit
                    </button>

                    <button
                      className={`secondary-button remove-button${confirmId === supplier.id ? " confirming" : ""}`}
                      disabled={protectedReferences > 0}
                      onClick={() => deleteSupplier(supplier)}
                      title={
                        protectedReferences
                          ? "Reassign linked products and close pending orders before removing this supplier."
                          : undefined
                      }
                      type="button"
                    >
                      {confirmId === supplier.id ? "Confirm remove" : "Remove"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export function ReportsPage({ state }) {
  const summary = useMemo(() => {
    const lowStock = state.products.filter(
      (product) => product.qty > 0 && statusOf(product) === "Low stock",
    );

    const outOfStock = state.products.filter((product) => product.qty === 0);

    const receivedOrders = state.orders.filter(
      (order) => order.status === "Received",
    );

    const pendingOrders = state.orders.filter(
      (order) => order.status === "Pending",
    );

    const orderedSpend = receivedOrders.reduce(
      (total, order) => total + order.unitPrice * order.quantity,

      0,
    );

    const categoryRows = categories.map((category) => {
      const items = state.products.filter(
        (product) => product.category === category,
      );

      const units = items.reduce((total, product) => total + product.qty, 0);

      const value = items.reduce(
        (total, product) => total + product.qty * product.price,

        0,
      );

      return { category, count: items.length, units, value };
    });

    return {
      lowStock,

      outOfStock,

      receivedOrders,

      pendingOrders,

      orderedSpend,

      categoryRows,

      inventoryValue: state.products.reduce(
        (total, product) => total + product.qty * product.price,

        0,
      ),

      totalUnits: state.products.reduce(
        (total, product) => total + product.qty,

        0,
      ),
    };
  }, [state.orders, state.products]);

  return (
    <>
      <PageHeading
        description="Live summaries calculated from your shared products, orders, and activity."
        title="Reports"
      />

      <section aria-label="Report summary" className="summary-grid">
        <SummaryCard
          icon="M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8"
          label="Inventory value"
          value={moneyFormat.format(summary.inventoryValue)}
          note="Based on current stock and unit prices"
        />

        <SummaryCard
          icon="M3 3h18v4H3z M5 7v14h14V7 M10 12h4"
          label="Units in stock"
          value={formatNumber(summary.totalUnits)}
          note={`${state.products.length} active products`}
        />

        <SummaryCard
          alert
          icon="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z M12 9v4 M12 17h.01"
          label="Low / out of stock"
          value={String(summary.lowStock.length + summary.outOfStock.length)}
          note={`${summary.outOfStock.length} currently out of stock`}
        />

        <SummaryCard
          icon="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18"
          label="Open orders"
          value={String(summary.pendingOrders.length)}
          note={`${summary.receivedOrders.length} orders received`}
        />
      </section>

      <section aria-label="Inventory by category" className="panel list-panel">
        <PanelTitle description="Quantities and current value by product category.">
          Inventory by category
        </PanelTitle>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>

                <th>Products</th>

                <th>Units</th>

                <th>Inventory value</th>

                <th>Stock level</th>
              </tr>
            </thead>

            <tbody>
              {summary.categoryRows.map((row) => {
                const max = Math.max(
                  1,

                  ...summary.categoryRows.map((item) => item.units),
                );

                return (
                  <tr key={row.category}>
                    <td>{row.category}</td>

                    <td>{formatNumber(row.count)}</td>

                    <td>{formatNumber(row.units)}</td>

                    <td>{moneyFormat.format(row.value)}</td>

                    <td>
                      <div className="report-bar">
                        <span
                          style={{
                            width: `${Math.round((row.units / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="report-columns">
        <section
          aria-label="Stock requiring attention"
          className="panel list-panel"
        >
          <PanelTitle description="Products at or below their reorder level.">
            Stock requiring attention
          </PanelTitle>

          {summary.lowStock.length + summary.outOfStock.length === 0 ? (
            <EmptyState title="No stock alerts">
              All products are above their reorder levels.
            </EmptyState>
          ) : (
            <div className="attention-list">
              {[...summary.outOfStock, ...summary.lowStock].map((product) => (
                <div className="attention-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>

                    <span>
                      {product.sku} · {product.category}
                    </span>
                  </div>

                  <span className={orderStatusClass(statusOf(product))}>
                    {statusOf(product)} · {product.qty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Purchasing report" className="panel list-panel">
          <PanelTitle description="Purchase order totals from the shared order list.">
            Purchasing
          </PanelTitle>

          <div className="report-total-row">
            <span>Received order value</span>

            <strong>{moneyFormat.format(summary.orderedSpend)}</strong>
          </div>

          <div className="report-total-row">
            <span>Orders received</span>

            <strong>{summary.receivedOrders.length}</strong>
          </div>

          <div className="report-total-row">
            <span>Orders pending</span>

            <strong>{summary.pendingOrders.length}</strong>
          </div>
        </section>
      </div>

      <section aria-label="Activity report" className="panel list-panel">
        <PanelTitle
          description={
            state.settings.dailyDigest
              ? "Latest changes recorded across the system."
              : "Activity digest is turned off in Settings."
          }
        >
          Activity report
        </PanelTitle>

        {state.settings.dailyDigest ? (
          <ActivityList activity={state.activity} limit={10} />
        ) : (
          <div className="muted-text">
            Turn on the daily inventory digest in Settings to include activity
            in reports.
          </div>
        )}
      </section>
    </>
  );
}

export function SettingsPage({ settings, dispatch }) {
  const [form, setForm] = useState(() => ({
    ...settings,

    defaultReorder: String(settings.defaultReorder),
  }));

  const [errors, setErrors] = useState({});

  const [notice, setNotice] = useState("");

  function update(event) {
    const { name, type, checked, value } = event.target;

    setForm((current) => ({
      ...current,

      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((current) => ({ ...current, [name]: undefined }));

    setNotice("");
  }

  function save(event) {
    event.preventDefault();

    const nextErrors = {};

    if (!form.warehouseName.trim())
      nextErrors.warehouseName = "Enter a warehouse name.";
    else if (form.warehouseName.trim().length > 80)
      nextErrors.warehouseName = "Use 80 characters or fewer.";

    const reorder = Number(form.defaultReorder);

    if (form.defaultReorder === "" || !Number.isInteger(reorder) || reorder < 0)
      nextErrors.defaultReorder = "Enter a non-negative whole number.";

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    dispatch({
      type: "UPDATE_SETTINGS",

      settings: {
        ...form,

        warehouseName: form.warehouseName.trim(),

        defaultReorder: reorder,
      },
    });

    setNotice(
      "Settings saved. New products will use the updated default reorder level.",
    );
  }

  return (
    <>
      <PageHeading
        description="Configure the warehouse and default inventory behavior."
        title="Settings"
      />

      {notice && (
        <div className="inline-notice success-notice" role="status">
          {notice}
        </div>
      )}

      <form
        aria-label="Inventory settings"
        className="panel add-form settings-form"
        noValidate
        onSubmit={save}
      >
        <PanelTitle description="These settings are stored with the rest of your Stockroom data.">
          Warehouse settings
        </PanelTitle>

        <div className="settings-fields">
          <Field
            error={errors.warehouseName}
            htmlFor="warehouse-name"
            label="Warehouse name"
          >
            <input
              {...inputProps(errors.warehouseName, "warehouse-name")}
              maxLength={80}
              name="warehouseName"
              onChange={update}
              value={form.warehouseName}
            />
          </Field>

          <Field
            error={errors.defaultReorder}
            htmlFor="default-reorder"
            hint="Used as the starting reorder level when you add a product."
            label="Default reorder level"
          >
            <input
              {...inputProps(errors.defaultReorder, "default-reorder")}
              min="0"
              name="defaultReorder"
              onChange={update}
              step="1"
              type="number"
              value={form.defaultReorder}
            />
          </Field>
        </div>

        <div className="settings-toggles">
          <Toggle
            checked={form.lowStockNotifications}
            help="Show low-stock counts and reorder reminders throughout the dashboard."
            label="Low-stock notifications"
            name="lowStockNotifications"
            onChange={update}
          />

          <Toggle
            checked={form.dailyDigest}
            help="Keep the recent activity and report summaries available in the app."
            label="Daily inventory digest"
            name="dailyDigest"
            onChange={update}
          />

          <Toggle
            checked={form.autoSku}
            help="Generate a unique category-based SKU when the SKU field is left blank."
            label="Auto-generate SKUs"
            name="autoSku"
            onChange={update}
          />
        </div>

        <div className="form-actions">
          <button className="primary-button save-button" type="submit">
            Save settings
          </button>
        </div>
      </form>

      <section
        aria-label="Data storage information"
        className="panel storage-panel"
      >
        <PanelTitle>Data storage</PanelTitle>

        <p>
          Your current data is shared across all six pages and saved in this
          browser. A database can replace this local storage layer later without
          changing the page-level data model.
        </p>

        <div className="storage-details">
          <span>Storage</span>

          <strong>Browser local storage</strong>

          <span>Data key</span>

          <code>stockroom.shared-store.v1</code>
        </div>
      </section>
    </>
  );
}

function Toggle({ checked, help, label, name, onChange }) {
  return (
    <label className="setting-toggle">
      <span className="toggle-copy">
        <strong>{label}</strong>

        <span>{help}</span>
      </span>

      <input
        checked={checked}
        name={name}
        onChange={onChange}
        role="switch"
        type="checkbox"
      />
    </label>
  );
}
