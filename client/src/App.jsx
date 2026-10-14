import { useEffect, useReducer, useState } from "react";

import {
  DashboardPage,
  InventoryPage,
  ReportsPage,
  SettingsPage,
} from "./Pages";

import SuppliersMongoPage from "./SuppliersMongoPage";

import OrdersMongoPage from "./OrdersMongoPage";

import { loadInitialState, storageKey, storeReducer } from "./store";

import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  adjustProductStock,
  toMongoProduct,
  fromMongoProduct,
} from "./api/productApi";

import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
  fromMongoSupplier,
} from "./api/supplierApi";

import {
  getOrders,
  createOrder,
  updateOrder,
  receiveOrder,
  cancelOrder,
  deleteOrder,
  fromMongoOrder,
} from "./api/orderApi";

import { getActivities, fromMongoActivity } from "./api/activityApi";

import "./App.css";

// SIDEBAR NAVIGATION

const navigation = [
  {
    label: "Dashboard",

    icon: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  },

  {
    label: "Inventory",

    icon: "M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8",
  },

  {
    label: "Orders",

    icon: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z M3 6h18 M16 10a4 4 0 01-8 0",
  },

  {
    label: "Suppliers",

    icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M4 19h3 M17 19h3",
  },

  {
    label: "Reports",

    icon: "M18 20V10 M12 20V4 M6 20v-6",
  },

  {
    label: "Settings",

    icon: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  },
];

// SIDEBAR ICON

function Icon({ d, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={d} />
    </svg>
  );
}

// GET READABLE API ERROR

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function App() {
  // LOCAL SETTINGS STATE

  const [state, dispatch] = useReducer(
    storeReducer,

    undefined,

    loadInitialState,
  );

  // NAVIGATION STATE

  const [activePage, setActivePage] = useState("Dashboard");

  const [editingProduct, setEditingProduct] = useState(null);

  // MONGODB DATA

  const [suppliers, setSuppliers] = useState([]);

  const [orders, setOrders] = useState([]);

  const [activities, setActivities] = useState([]);

  // LOADING AND ERROR STATES

  const [loading, setLoading] = useState(true);

  const [dataReady, setDataReady] = useState(false);

  const [apiError, setApiError] = useState("");

  // COMBINED DATA FOR DASHBOARD AND REPORTS

  const currentState = {
    ...state,

    suppliers,

    orders,

    activity: activities,

    activities,
  };

  // SAVE SETTINGS TO LOCAL STORAGE

  // MONGODB REMAINS THE SOURCE OF TRUTH

  useEffect(() => {
    if (state.preserveSavedData) return;

    try {
      const persisted = {
        ...state,

        products: [],

        suppliers: [],

        orders: [],

        activity: [],

        activities: [],
      };

      delete persisted.storageError;

      delete persisted.preserveSavedData;

      localStorage.setItem(
        storageKey,

        JSON.stringify(persisted),
      );
    } catch (error) {
      console.error("Local storage error:", error);
    }
  }, [state]);

  // LOAD ALL DATA FROM MONGODB

  async function loadAllData({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
      setDataReady(false);
    }

    setApiError("");

    try {
      const [productData, supplierData, orderData] = await Promise.all([
        getProducts(),

        getSuppliers(),

        getOrders(),
      ]);

      // CONVERT DATA FOR FRONTEND

      const formattedProducts = productData.map(fromMongoProduct);

      const formattedSuppliers = supplierData.map(fromMongoSupplier);

      const formattedOrders = orderData.map(fromMongoOrder);

      // UPDATE FRONTEND STATE

      dispatch({
        type: "SET_PRODUCTS",

        products: formattedProducts,
      });

      setSuppliers(formattedSuppliers);

      setOrders(formattedOrders);

      // ACTIVITY FAILURE SHOULD NOT BLOCK INVENTORY

      try {
        const activityData = await getActivities();

        setActivities(activityData.map(fromMongoActivity));
      } catch (error) {
        console.error(
          "Failed to load activities:",

          error,
        );

        setActivities([]);
      }

      setDataReady(true);

      return true;
    } catch (error) {
      console.error(
        "Failed to load Stockroom data:",

        error,
      );

      setApiError(
        "Unable to load Stockroom data. " +
          getErrorMessage(
            error,

            "Please check the backend connection.",
          ),
      );

      if (!silent) setDataReady(false);

      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // INITIAL DATABASE LOAD

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const [productData, supplierData, orderData] = await Promise.all([
          getProducts(),

          getSuppliers(),

          getOrders(),
        ]);

        if (cancelled) return;

        dispatch({
          type: "SET_PRODUCTS",

          products: productData.map(fromMongoProduct),
        });

        setSuppliers(supplierData.map(fromMongoSupplier));

        setOrders(orderData.map(fromMongoOrder));

        try {
          const activityData = await getActivities();

          if (!cancelled) {
            setActivities(activityData.map(fromMongoActivity));
          }
        } catch (error) {
          console.error(
            "Failed to load activities:",

            error,
          );

          if (!cancelled) {
            setActivities([]);
          }
        }

        if (!cancelled) {
          setApiError("");

          setDataReady(true);
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Initial database loading failed:",

          error,
        );

        setApiError(
          "Unable to connect to Stockroom data. " +
            getErrorMessage(
              error,

              "Check the backend and MongoDB.",
            ),
        );

        setDataReady(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  // REFRESH DATA AFTER SUCCESSFUL DATABASE OPERATION

  async function refreshAfterMutation() {
    const refreshed = await loadAllData({ silent: true });

    if (!refreshed) {
      setApiError(
        "The database operation was completed, " +
          "but the latest data could not be loaded. " +
          "Please reconnect and refresh the data.",
      );
    }
  }

  // PRODUCTS

  async function saveProductToDatabase(product, editingId) {
    try {
      const data = toMongoProduct(product);

      if (editingId) {
        await updateProduct(editingId, data);
      } else {
        await addProduct(data);
      }
    } catch (error) {
      return getErrorMessage(
        error,

        "Unable to save product.",
      );
    }

    await refreshAfterMutation();

    return "";
  }

  async function deleteProductFromDatabase(product) {
    try {
      await deleteProduct(product.id);
    } catch (error) {
      return getErrorMessage(
        error,

        "Unable to delete product.",
      );
    }

    await refreshAfterMutation();

    return "";
  }

  async function adjustStockInDatabase(product, amount) {
    try {
      await adjustProductStock(product.id, amount);
    } catch (error) {
      const message = getErrorMessage(
        error,

        "Unable to update stock.",
      );

      setApiError(message);

      return message;
    }

    await refreshAfterMutation();

    return "";
  }

  // SUPPLIERS

  async function saveNewSupplier(data) {
    await addSupplier(data);

    await refreshAfterMutation();
  }

  async function saveUpdatedSupplier(id, data) {
    await updateSupplier(id, data);

    await refreshAfterMutation();
  }

  async function removeSupplierFromDatabase(id) {
    await deleteSupplier(id);

    await refreshAfterMutation();
  }

  // ORDERS

  async function saveNewOrder(data) {
    await createOrder(data);

    await refreshAfterMutation();
  }

  async function saveUpdatedOrder(id, quantity) {
    await updateOrder(id, quantity);

    await refreshAfterMutation();
  }

  async function receiveOrderFromDatabase(id) {
    await receiveOrder(id);

    await refreshAfterMutation();
  }

  async function cancelOrderFromDatabase(id) {
    await cancelOrder(id);

    await refreshAfterMutation();
  }

  async function deleteOrderFromDatabase(id) {
    await deleteOrder(id);

    await refreshAfterMutation();
  }

  // OPEN INVENTORY FROM DASHBOARD

  function openInventory(product) {
    setEditingProduct(product);

    setActivePage("Inventory");
  }

  // RENDER ACTIVE PAGE

  function renderPage() {
    switch (activePage) {
      case "Inventory":
        return (
          <InventoryPage
            state={currentState}
            dispatch={dispatch}
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            onSave={saveProductToDatabase}
            onAdjust={adjustStockInDatabase}
            onDelete={deleteProductFromDatabase}
          />
        );

      case "Orders":
        return (
          <OrdersMongoPage
            orders={orders}
            products={state.products}
            suppliers={suppliers}
            loading={loading}
            onCreate={saveNewOrder}
            onUpdate={saveUpdatedOrder}
            onReceive={receiveOrderFromDatabase}
            onCancel={cancelOrderFromDatabase}
            onDelete={deleteOrderFromDatabase}
          />
        );

      case "Suppliers":
        return (
          <SuppliersMongoPage
            suppliers={suppliers}
            products={state.products}
            orders={orders}
            loading={loading}
            onAdd={saveNewSupplier}
            onUpdate={saveUpdatedSupplier}
            onDelete={removeSupplierFromDatabase}
          />
        );

      case "Reports":
        return <ReportsPage state={currentState} />;

      case "Settings":
        return <SettingsPage settings={state.settings} dispatch={dispatch} />;

      default:
        return (
          <DashboardPage
            state={currentState}
            dispatch={dispatch}
            onOpenInventory={openInventory}
            onAdjust={adjustStockInDatabase}
            onDelete={deleteProductFromDatabase}
          />
        );
    }
  }

  // MAIN APPLICATION

  return (
    <div className="inventory-app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Icon
              d="M21 8l-9-5-9 5 9 5 9-5z M3 8v8l9 5 9-5V8 M12 13v8"
              size={20}
            />
          </div>

          <div className="brand-name">Stockroom</div>
        </div>

        <nav aria-label="Main" className="main-nav">
          <div className="nav-heading">Menu</div>

          {navigation.map((item) => (
            <a
              key={item.label}
              href={`#${item.label.toLowerCase()}`}
              aria-current={activePage === item.label ? "page" : undefined}
              className={`nav-link${
                activePage === item.label ? " active" : ""
              }`}
              onClick={(event) => {
                event.preventDefault();

                setActivePage(item.label);

                if (item.label !== "Inventory") {
                  setEditingProduct(null);
                }
              }}
            >
              <Icon d={item.icon} />

              {item.label}

              {item.label === "Dashboard" &&
                state.settings.lowStockNotifications && (
                  <span className="nav-badge">
                    {dataReady
                      ? state.products.filter(
                          (product) => product.qty <= product.reorder,
                        ).length
                      : 0}
                  </span>
                )}
            </a>
          ))}
        </nav>

        <div className="profile">
          <div className="profile-avatar">WA</div>

          <div>
            <div className="profile-name">Warehouse Admin</div>

            <div className="profile-location">
              {state.settings.warehouseName}
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {state.storageError && (
          <div className="inline-notice error-notice" role="alert">
            {state.storageError}
          </div>
        )}

        {apiError && (
          <div className="inline-notice error-notice" role="alert">
            {apiError}
          </div>
        )}

        {loading ? (
          <div className="panel" style={{ padding: 24 }}>
            Loading Stockroom data from MongoDB...
          </div>
        ) : !dataReady ? (
          <div className="panel" style={{ padding: 24 }}>
            <h2>Database Connection Error</h2>

            <p>Stockroom could not load the latest data from MongoDB.</p>

            <p>Check that the backend server and MongoDB are running.</p>

            <button type="button" onClick={loadAllData}>
              Retry Connection
            </button>
          </div>
        ) : (
          renderPage()
        )}
      </main>
    </div>
  );
}

export default App;
