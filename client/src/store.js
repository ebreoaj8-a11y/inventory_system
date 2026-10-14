export const categories = ['Apparel', 'Electronics', 'Home', 'Office', 'Grocery']

export const initialProducts = [
  { id: 1, name: 'Cotton Crew Tee, M', sku: 'APP-1001', category: 'Apparel', supplierId: 1, qty: 48, reorder: 20, price: 349 },
  { id: 2, name: 'Denim Jacket, L', sku: 'APP-1014', category: 'Apparel', supplierId: 1, qty: 6, reorder: 10, price: 1899 },
  { id: 3, name: 'Wireless Mouse', sku: 'ELE-2007', category: 'Electronics', supplierId: 2, qty: 31, reorder: 15, price: 699 },
  { id: 4, name: 'USB-C Charger 65W', sku: 'ELE-2022', category: 'Electronics', supplierId: 2, qty: 0, reorder: 12, price: 1290 },
  { id: 5, name: 'Mechanical Keyboard', sku: 'ELE-2035', category: 'Electronics', supplierId: 2, qty: 9, reorder: 10, price: 3450 },
  { id: 6, name: 'Ceramic Mug Set', sku: 'HOM-3003', category: 'Home', supplierId: 3, qty: 54, reorder: 20, price: 520 },
  { id: 7, name: 'LED Desk Lamp', sku: 'HOM-3018', category: 'Home', supplierId: 3, qty: 17, reorder: 15, price: 990 },
  { id: 8, name: 'Spiral Notebook A5', sku: 'OFF-4001', category: 'Office', supplierId: 4, qty: 120, reorder: 50, price: 85 },
  { id: 9, name: 'Gel Pens, 12 pack', sku: 'OFF-4009', category: 'Office', supplierId: 4, qty: 14, reorder: 30, price: 160 },
  { id: 10, name: 'Heavy Duty Stapler', sku: 'OFF-4015', category: 'Office', supplierId: 4, qty: 26, reorder: 10, price: 275 },
  { id: 11, name: 'Instant Coffee 200g', sku: 'GRO-5002', category: 'Grocery', supplierId: 5, qty: 0, reorder: 24, price: 245 },
  { id: 12, name: 'Rolled Oats 1kg', sku: 'GRO-5011', category: 'Grocery', supplierId: 5, qty: 63, reorder: 25, price: 198 },
  { id: 13, name: 'Linen Shirt, L', sku: 'APP-1022', category: 'Apparel', supplierId: 1, qty: 22, reorder: 12, price: 1250 },
  { id: 14, name: 'Knit Beanie', sku: 'APP-1030', category: 'Apparel', supplierId: 1, qty: 0, reorder: 8, price: 320 },
  { id: 15, name: 'Running Socks, 3 pack', sku: 'APP-1038', category: 'Apparel', supplierId: 1, qty: 75, reorder: 30, price: 280 },
  { id: 16, name: 'Bluetooth Speaker', sku: 'ELE-2041', category: 'Electronics', supplierId: 2, qty: 12, reorder: 10, price: 1890 },
  { id: 17, name: 'Webcam 1080p', sku: 'ELE-2050', category: 'Electronics', supplierId: 2, qty: 5, reorder: 8, price: 1150 },
  { id: 18, name: 'Throw Pillow', sku: 'HOM-3027', category: 'Home', supplierId: 3, qty: 33, reorder: 12, price: 430 },
  { id: 19, name: 'Scented Candle', sku: 'HOM-3031', category: 'Home', supplierId: 3, qty: 8, reorder: 15, price: 380 },
  { id: 20, name: 'Sticky Notes, 6 pack', sku: 'OFF-4022', category: 'Office', supplierId: 4, qty: 88, reorder: 40, price: 120 },
  { id: 21, name: 'Desk Organizer', sku: 'OFF-4030', category: 'Office', supplierId: 4, qty: 19, reorder: 10, price: 540 },
  { id: 22, name: 'Green Tea, 50 bags', sku: 'GRO-5019', category: 'Grocery', supplierId: 5, qty: 41, reorder: 20, price: 175 },
  { id: 23, name: 'Olive Oil 500ml', sku: 'GRO-5024', category: 'Grocery', supplierId: 5, qty: 7, reorder: 12, price: 560 },
  { id: 24, name: 'Penne Pasta 500g', sku: 'GRO-5030', category: 'Grocery', supplierId: 5, qty: 96, reorder: 40, price: 89 },
]

export const initialSuppliers = [
  { id: 1, name: 'Thread & Loom Co.', contact: 'Mia Santos', email: 'mia@threadloom.example', phone: '+63 2 8123 1001', category: 'Apparel' },
  { id: 2, name: 'Circuit Supply', contact: 'Noah Reyes', email: 'orders@circuitsupply.example', phone: '+63 2 8123 2002', category: 'Electronics' },
  { id: 3, name: 'Hearthside Goods', contact: 'Lea Cruz', email: 'hello@hearthside.example', phone: '+63 2 8123 3003', category: 'Home' },
  { id: 4, name: 'Paper Trail Wholesale', contact: 'Eli Garcia', email: 'sales@papertrail.example', phone: '+63 2 8123 4004', category: 'Office' },
  { id: 5, name: 'Daily Harvest Trading', contact: 'Ana Flores', email: 'supply@dailyharvest.example', phone: '+63 2 8123 5005', category: 'Grocery' },
]

export const initialOrders = [
  { id: 1, number: 'PO-1048', supplierId: 5, productId: 12, quantity: 50, unitPrice: 198, status: 'Received', createdAt: '2026-10-08' },
  { id: 2, number: 'PO-1049', supplierId: 2, productId: 4, quantity: 24, unitPrice: 1290, status: 'Pending', createdAt: '2026-10-10' },
  { id: 3, number: 'PO-1050', supplierId: 1, productId: 2, quantity: 20, unitPrice: 1899, status: 'Pending', createdAt: '2026-10-10' },
]

export const initialActivity = [
  { id: 3, kind: 'in', text: 'Restocked Rolled Oats 1kg, +50 units', time: '9:12 AM' },
  { id: 2, kind: 'out', text: 'Removed 3 units from Wireless Mouse', time: '9:40 AM' },
  { id: 1, kind: 'new', text: 'Added Penne Pasta 500g to the catalog', time: '10:05 AM' },
]

export const storageKey = 'stockroom.shared-store.v1'

export function createInitialState() {
  return {
    products: initialProducts,
    suppliers: initialSuppliers,
    orders: initialOrders,
    activity: initialActivity,
    settings: {
      warehouseName: 'Main warehouse',
      defaultReorder: 10,
      lowStockNotifications: true,
      dailyDigest: true,
      autoSku: true,
    },
    nextProductId: 25,
    nextSupplierId: 6,
    nextOrderId: 4,
    nextActivityId: 4,
    storageError: '',
    preserveSavedData: false,
  }
}

function isValidSavedState(state) {
  return state
    && Array.isArray(state.products)
    && Array.isArray(state.suppliers)
    && Array.isArray(state.orders)
    && Array.isArray(state.activity)
    && state.settings
    && Number.isInteger(state.nextProductId)
    && Number.isInteger(state.nextSupplierId)
    && Number.isInteger(state.nextOrderId)
    && Number.isInteger(state.nextActivityId)
}

export function loadInitialState() {
  const initial = createInitialState()
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return initial
    const parsed = JSON.parse(saved)
    if (!isValidSavedState(parsed)) throw new Error('Saved inventory data has an unexpected format.')
    return { ...initial, ...parsed, storageError: '' }
  } catch (error) {
    console.error('Unable to load saved Stockroom data:', error)
    return {
      ...initial,
      storageError: `Saved data could not be loaded. The sample data is shown instead. ${error.message}`,
      preserveSavedData: true,
    }
  }
}

function activityEntry(state, kind, text) {
  return {
    activity: [{
      id: state.nextActivityId,
      kind,
      text,
      time: new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
    }, ...state.activity].slice(0, 20),
    nextActivityId: state.nextActivityId + 1,
  }
}

export function storeReducer(state, action) {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.products }
    case 'CREATE_PRODUCT': {
      const product = { ...action.product, id: state.nextProductId }
      return {
        ...state,
        products: [...state.products, product],
        nextProductId: state.nextProductId + 1,
        ...activityEntry(state, 'new', `Added ${product.name} to the catalog`),
      }
    }
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((product) => product.id === action.product.id ? action.product : product),
        ...activityEntry(state, 'edit', `Updated ${action.product.name}`),
      }
    case 'DELETE_PRODUCT': {
      const product = state.products.find((item) => item.id === action.id)
      if (!product) return state
      if (state.orders.some((order) => order.productId === action.id && order.status === 'Pending')) return state
      return {
        ...state,
        products: state.products.filter((item) => item.id !== action.id),
        orders: state.orders.map((order) => order.productId === action.id
          ? { ...order, productId: null, productName: order.productName || product.name }
          : order),
        ...activityEntry(state, 'del', `Deleted ${product.name} from the catalog`),
      }
    }
    case 'ADJUST_STOCK': {
      const product = state.products.find((item) => item.id === action.id)
      if (!product) return state
      const qty = Math.max(0, product.qty + action.amount)
      if (qty === product.qty) return state
      const difference = Math.abs(qty - product.qty)
      const unit = difference === 1 ? 'unit' : 'units'
      return {
        ...state,
        products: state.products.map((item) => item.id === action.id ? { ...item, qty } : item),
        ...activityEntry(
          state,
          action.amount > 0 ? 'in' : 'out',
          `${action.amount > 0 ? 'Added' : 'Removed'} ${difference} ${unit} ${action.amount > 0 ? 'to' : 'from'} ${product.name}`,
        ),
      }
    }
    case 'RESTOCK': {
      const product = state.products.find((item) => item.id === action.id)
      if (!product || !Number.isInteger(action.quantity) || action.quantity <= 0) return state
      return {
        ...state,
        products: state.products.map((item) => item.id === action.id ? { ...item, qty: item.qty + action.quantity } : item),
        ...activityEntry(state, 'in', `Restocked ${product.name}, +${action.quantity} units`),
      }
    }
    case 'CREATE_SUPPLIER':
      return {
        ...state,
        suppliers: [...state.suppliers, { ...action.supplier, id: state.nextSupplierId }],
        nextSupplierId: state.nextSupplierId + 1,
        ...activityEntry(state, 'new', `Added supplier ${action.supplier.name}`),
      }
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map((supplier) => supplier.id === action.supplier.id ? action.supplier : supplier),
        ...activityEntry(state, 'edit', `Updated supplier ${action.supplier.name}`),
      }
    case 'DELETE_SUPPLIER': {
      const supplier = state.suppliers.find((item) => item.id === action.id)
      if (!supplier
        || state.products.some((product) => product.supplierId === action.id)
        || state.orders.some((order) => order.supplierId === action.id && order.status === 'Pending')) return state
      return {
        ...state,
        suppliers: state.suppliers.filter((item) => item.id !== action.id),
        orders: state.orders.map((order) => order.supplierId === action.id
          ? { ...order, supplierId: null, supplierName: order.supplierName || supplier.name }
          : order),
        ...activityEntry(state, 'del', `Removed supplier ${supplier.name}`),
      }
    }
    case 'CREATE_ORDER': {
      const product = state.products.find((item) => item.id === action.order.productId)
      if (!product) return state
      const order = {
        ...action.order,
        id: state.nextOrderId,
        number: `PO-${String(1047 + state.nextOrderId).padStart(4, '0')}`,
        productName: product.name,
        supplierName: state.suppliers.find((supplier) => supplier.id === action.order.supplierId)?.name || 'Supplier removed',
        unitPrice: product.price,
        status: 'Pending',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      return {
        ...state,
        orders: [order, ...state.orders],
        nextOrderId: state.nextOrderId + 1,
        ...activityEntry(state, 'order', `Created ${order.number} for ${product.name}`),
      }
    }
    case 'RECEIVE_ORDER': {
      const order = state.orders.find((item) => item.id === action.id)
      if (!order || order.status !== 'Pending') return state
      const product = state.products.find((item) => item.id === order.productId)
      if (!product) return state
      return {
        ...state,
        orders: state.orders.map((item) => item.id === order.id ? { ...item, status: 'Received' } : item),
        products: state.products.map((item) => item.id === product.id ? { ...item, qty: item.qty + order.quantity } : item),
        ...activityEntry(state, 'in', `Received ${order.quantity} units of ${product.name} (${order.number})`),
      }
    }
    case 'CANCEL_ORDER': {
      const order = state.orders.find((item) => item.id === action.id)
      if (!order || order.status !== 'Pending') return state
      return {
        ...state,
        orders: state.orders.map((item) => item.id === order.id ? { ...item, status: 'Cancelled' } : item),
        ...activityEntry(state, 'del', `Cancelled ${order.number}`),
      }
    }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }
    case 'SET_STORAGE_ERROR':
      if (state.storageError === action.message && !state.preserveSavedData) return state
      return { ...state, storageError: action.message, preserveSavedData: false }
    case 'ACK_STORAGE_ERROR':
      return { ...state, storageError: '', preserveSavedData: false }
    default:
      return state
  }
}
