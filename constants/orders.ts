export const ORDER_STATUSES = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; label: string; icon: string }> = {
  pending:    { color: '#d97706', bg: '#fffbeb', label: 'Menunggu',    icon: '◷' },
  preparing:  { color: '#2563eb', bg: '#eff6ff', label: 'Disiapkan',   icon: '👨‍🍳' },
  delivering: { color: '#7c3aed', bg: '#f5f3ff', label: 'Dikirim',     icon: '🚗' },
  delivered:  { color: '#16a34a', bg: '#f0fdf4', label: 'Selesai',     icon: '✓' },
  cancelled:  { color: '#dc2626', bg: '#fef2f2', label: 'Dibatalkan',  icon: '✕' },
};

export const ORDER_STEPS = [
  { key: 'pending',    label: 'Pesanan Diterima',    icon: '✓' },
  { key: 'preparing',  label: 'Sedang Disiapkan',    icon: '👨‍🍳' },
  { key: 'delivering', label: 'Dalam Pengiriman',    icon: '🚗' },
  { key: 'delivered',  label: 'Pesanan Diterima',    icon: '📦' },
];

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  serviceFee: number;
  total: number;
  restaurantId: string;
  restaurantName: string;
  deliveryAddress: string;
  paymentMethod: string;
  createdAt: string;
  photoUrl?: string;
};

export function getActiveStep(status: OrderStatus): number {
  switch (status) {
    case 'pending':    return 0;
    case 'preparing':  return 1;
    case 'delivering': return 2;
    case 'delivered':  return 3;
    default:           return -1;
  }
}