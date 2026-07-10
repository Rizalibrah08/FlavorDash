import { Order } from './orders';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    restaurantId: '6',
    restaurantName: "McDonald's",
    items: [
      { id: 'f1', name: 'McChicken Burger', price: 35000, quantity: 2 },
      { id: 'f2', name: 'French Fries Large', price: 20000, quantity: 1 },
    ],
    status: 'delivering',
    subtotal: 90000,
    shippingCost: 10000,
    serviceFee: 2000,
    total: 102000,
    deliveryAddress: 'Jl. Jagakarsa Raya No. 8, Jakarta Selatan',
    paymentMethod: 'Transfer Bank',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 menit lalu
  },
  {
    id: 'ORD-002',
    restaurantId: '1',
    restaurantName: 'Pizza Hut',
    items: [
      { id: 'f3', name: 'Pizza Pepperoni Large', price: 120000, quantity: 1 },
      { id: 'f4', name: 'Garlic Bread', price: 25000, quantity: 2 },
      { id: 'f5', name: 'Coca Cola', price: 15000, quantity: 2 },
    ],
    status: 'delivered',
    subtotal: 200000,
    shippingCost: 10000,
    serviceFee: 2000,
    total: 212000,
    deliveryAddress: 'Jl. Tanjung Barat No. 15, Jakarta Selatan',
    paymentMethod: 'Transfer Bank',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 jam lalu
    photoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
  },
  {
    id: 'ORD-003',
    restaurantId: '3',
    restaurantName: 'KFC',
    items: [
      { id: 'f6', name: 'Paket Ayam 2 Potong', price: 42000, quantity: 1 },
      { id: 'f7', name: 'Nasi Putih', price: 8000, quantity: 1 },
    ],
    status: 'preparing',
    subtotal: 50000,
    shippingCost: 10000,
    serviceFee: 2000,
    total: 62000,
    deliveryAddress: 'Jl. Raya Pasar Minggu No. 30, Jakarta Selatan',
    paymentMethod: 'Transfer Bank',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 menit lalu
  },
  {
    id: 'ORD-004',
    restaurantId: '4',
    restaurantName: 'Starbucks',
    items: [
      { id: 'f8', name: 'Caramel Frappuccino', price: 65000, quantity: 2 },
      { id: 'f9', name: 'Blueberry Muffin', price: 35000, quantity: 1 },
    ],
    status: 'pending',
    subtotal: 165000,
    shippingCost: 10000,
    serviceFee: 2000,
    total: 177000,
    deliveryAddress: 'Jl. TB Simatupang No. 45, Jakarta Selatan',
    paymentMethod: 'Transfer Bank',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 menit lalu
  },
  {
    id: 'ORD-005',
    restaurantId: '2',
    restaurantName: 'Bakmi GM',
    items: [
      { id: 'f10', name: 'Bakmi Goreng Special', price: 55000, quantity: 1 },
      { id: 'f11', name: 'Bakso Urat', price: 45000, quantity: 1 },
    ],
    status: 'cancelled',
    subtotal: 100000,
    shippingCost: 10000,
    serviceFee: 2000,
    total: 112000,
    deliveryAddress: 'Jl. Raya Lenteng Agung No. 20, Jakarta Selatan',
    paymentMethod: 'Transfer Bank',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 hari lalu
  },
];

// Map restoran ke koordinat (untuk peta di order-detail)
export const RESTAURANT_LOCATIONS: Record<string, { latitude: number; longitude: number }> = {
  '1': { latitude: -6.3250, longitude: 106.8980 },
  '2': { latitude: -6.3420, longitude: 106.9120 },
  '3': { latitude: -6.3380, longitude: 106.8990 },
  '4': { latitude: -6.3200, longitude: 106.9150 },
  '5': { latitude: -6.3450, longitude: 106.9180 },
  '6': { latitude: -6.3500, longitude: 106.9050 },
};

export const USER_LOCATION = { latitude: -6.33486, longitude: 106.9955 };
