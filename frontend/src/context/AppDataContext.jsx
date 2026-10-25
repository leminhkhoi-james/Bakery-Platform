/**
 * AppDataContext — Global shared state for MSS301 SweetCake demo
 *
 * Manages the end-to-end lifecycle:
 *   Customer submits RFQ → Vendor sees on Marketplace → Vendor sends bid
 *   → Customer accepts bid → Order appears in Vendor Kanban
 */

import { createContext, useContext, useState } from 'react'
import { INITIAL_RFQS } from '../mockData/vendor/rfqs.js'
import { BIDS_DATA } from '../mockData/customer/quotes.js'
import { INITIAL_KANBAN_ORDERS } from '../mockData/vendor/orders.js'

// ─── Default bids seeded for the demo RFQ ────────────────────────────────────
// BiddingComparisonPage expects bids keyed by rfqId
const DEFAULT_BIDS = {
  '#RFQ-2025-8892': BIDS_DATA,
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AppDataContext = createContext(null)

// ─── Provider ────────────────────────────────────────────────────────────────
export function AppDataProvider({ children }) {
  /** List of RFQs shown on Vendor Marketplace. Customer-submitted RFQs are prepended. */
  const [rfqs, setRfqs] = useState(INITIAL_RFQS)

  /** Map: rfqId → Bid[]. Vendor-submitted bids keyed by the RFQ they belong to. */
  const [bids, setBids] = useState(DEFAULT_BIDS)

  /** Kanban order board for Vendor Order Management. */
  const [kanbanOrders, setKanbanOrders] = useState(INITIAL_KANBAN_ORDERS)

  /** The RFQ ID that the current Customer session is tracking. */
  const [activeRfqId, setActiveRfqId] = useState('#RFQ-2025-8892')

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Customer submits a new RFQ from AI Studio.
   * Prepends to the rfqs list so it appears first in Vendor Marketplace.
   */
  const addRfq = (rfq) => {
    setRfqs((prev) => [rfq, ...prev])
    setActiveRfqId(rfq.id)
    try {
      localStorage.setItem('sweetcake_active_rfq', JSON.stringify(rfq))
    } catch { }
  }

  /**
   * Vendor submits a quote/bid for a specific RFQ.
   * Also updates the RFQ's status to 'QUOTED' and increments bidsSent.
   * @param {string} rfqId
   * @param {Object} bid — same shape as BIDS_DATA entries
   */
  const addBid = (rfqId, bid) => {
    setBids((prev) => ({
      ...prev,
      [rfqId]: [...(prev[rfqId] || []), bid],
    }))
    // Update RFQ status → QUOTED and increment bid count
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === rfqId
          ? {
              ...r,
              status: 'QUOTED',
              statusText: 'Đang nhận báo giá',
              bidsSent: (r.bidsSent || 0) + 1,
            }
          : r
      )
    )
  }

  /**
   * Customer accepts a bid. This:
   * 1. Updates the RFQ status to CUSTOMER_ACCEPTED
   * 2. Creates a new pending order in the Vendor Kanban
   * @param {string} rfqId
   * @param {Object} acceptedBid — the bid the customer chose
   */
  const acceptBid = (rfqId, acceptedBid) => {
    // Find the source RFQ for order details
    const rfq = rfqs.find((r) => r.id === rfqId)

    // Update RFQ status
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === rfqId ? { ...r, status: 'CUSTOMER_ACCEPTED' } : r
      )
    )

    // Build the new Kanban pending order from RFQ + accepted bid data
    if (rfq) {
      const orderCode = `#ORD-${Date.now().toString().slice(-4)}`
      const newOrder = {
        id: orderCode,
        rfqId: rfqId,
        customer: rfq.customerName || 'Khách hàng',
        phone: rfq.customerPhone || '0900 000 000',
        category: rfq.category || 'birthday',
        deliveryTime: `${rfq.needDate || '25/10'} - ${rfq.deliveryTime || '15:30'}`,
        address: rfq.shortAddress || rfq.address || 'TP. Hồ Chí Minh',
        title: rfq.title,
        sizeSpec: rfq.sizeRequirement || rfq.selectedSize || 'Theo yêu cầu',
        description: rfq.description || rfq.customerNote || '',
        price: acceptedBid.price || rfq.budget || 950000,
        image: rfq.image || '',
        escrowLocked: true,
        isUrgent: true,
        urgentReason: 'Khách vừa chốt báo giá • Cần xác nhận trong 15 phút',
        timeline: [
          { time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), text: 'Khách đăng yêu cầu RFQ trên sàn' },
          { time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), text: `Tiệm gửi báo giá ${new Intl.NumberFormat('vi-VN').format(acceptedBid.price || rfq.budget)}đ` },
          { time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), text: `Khách chốt tiệm & Đặt cọc Escrow thành công` },
          { time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), text: 'Chờ tiệm xác nhận nhận đơn' },
        ],
      }
      setKanbanOrders((prev) => ({
        ...prev,
        pending: [newOrder, ...prev.pending],
      }))
    }
  }

  /**
   * Vendor updates the full Kanban board (used by VendorOrderManagementPage).
   * Replaces the entire kanbanOrders state.
   */
  const updateKanban = (newKanban) => {
    setKanbanOrders(newKanban)
  }

  const value = {
    // State
    rfqs,
    bids,
    kanbanOrders,
    activeRfqId,
    // Actions
    addRfq,
    addBid,
    acceptBid,
    setActiveRfqId,
    updateKanban,
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) {
    throw new Error('useAppData must be used inside <AppDataProvider>')
  }
  return ctx
}
