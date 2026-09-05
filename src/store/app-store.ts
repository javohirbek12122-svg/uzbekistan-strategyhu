'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  weightGram: number;
  imageUrl?: string;
}

export interface OrderDraft {
  id: string;
  items: CartItem[];
  address: string;
  phone: string;
  paymentMethod: 'cash' | 'p2p_telegram';
  zoneId?: string;
  landmark?: string;
  status: 'draft' | 'syncing' | 'synced';
  createdAt: number;
  syncedAt?: number;
}

export interface Landmark {
  id: string;
  name: string;
  zoneId: string;
  icon: string;
}

interface AppState {
  hasMounted: boolean;
  setMounted: (mounted: boolean) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  orderDrafts: OrderDraft[];
  saveOrderDraft: (draft: OrderDraft) => void;
  markOrderSynced: (id: string) => void;
  removeOrderDraft: (id: string) => void;
  landmarks: Landmark[];
  addLandmark: (landmark: Landmark) => void;
  removeLandmark: (id: string) => void;
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  pwaInstalled: boolean;
  setPwaInstalled: (installed: boolean) => void;
  exchangeRate: { usd: number; updatedAt: number } | null;
  setExchangeRate: (rate: { usd: number; updatedAt: number }) => void;
  devziraPrice: { price: number; updatedAt: number } | null;
  setDevziraPrice: (price: { price: number; updatedAt: number }) => void;
  wallet: { balance: number; coins: number; cashbackRate: number };
  addCashback: (amount: number) => void;
  spendCoins: (coins: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasMounted: false,
      setMounted: (mounted) => set({ hasMounted: mounted }),
      cart: [],
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.productId === item.productId);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.productId === item.productId ? { ...c, quantity: c.quantity + item.quantity } : c
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      updateCartItem: (productId, quantity) =>
        set((state) => ({
          cart: quantity <= 0
            ? state.cart.filter((c) => c.productId !== productId)
            : state.cart.map((c) => (c.productId === productId ? { ...c, quantity } : c)),
        })),
      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((c) => c.productId !== productId) })),
      clearCart: () => set({ cart: [] }),
      orderDrafts: [],
      saveOrderDraft: (draft) =>
        set((state) => ({ orderDrafts: [draft, ...state.orderDrafts.filter((d) => d.id !== draft.id)] })),
      markOrderSynced: (id) =>
        set((state) => ({
          orderDrafts: state.orderDrafts.map((d) =>
            d.id === id ? { ...d, status: 'synced', syncedAt: Date.now() } : d
          ),
        })),
      removeOrderDraft: (id) =>
        set((state) => ({ orderDrafts: state.orderDrafts.filter((d) => d.id !== id) })),
      landmarks: [],
      addLandmark: (landmark) =>
        set((state) => ({ landmarks: [...state.landmarks, landmark] })),
      removeLandmark: (id) =>
        set((state) => ({ landmarks: state.landmarks.filter((l) => l.id !== id) })),
      isOnline: true,
      setOnline: (online) => set({ isOnline: online }),
      pwaInstalled: false,
      setPwaInstalled: (installed) => set({ pwaInstalled: installed }),
      exchangeRate: null,
      setExchangeRate: (rate) => set({ exchangeRate: rate }),
      devziraPrice: null,
      setDevziraPrice: (price) => set({ devziraPrice: price }),
      wallet: { balance: 0, coins: 0, cashbackRate: 0.02 },
      addCashback: (amount) =>
        set((state) => ({
          wallet: {
            ...state.wallet,
            balance: state.wallet.balance + amount,
            coins: state.wallet.coins + Math.floor(amount / 1000),
          },
        })),
      spendCoins: (coins) =>
        set((state) => ({
          wallet: { ...state.wallet, coins: Math.max(0, state.wallet.coins - coins) },
        })),
    }),
    {
      name: 'parkent-emart-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        cart: state.cart,
        orderDrafts: state.orderDrafts,
        landmarks: state.landmarks,
        pwaInstalled: state.pwaInstalled,
        exchangeRate: state.exchangeRate,
        devziraPrice: state.devziraPrice,
        wallet: state.wallet,
      }),
    }
  )
);
