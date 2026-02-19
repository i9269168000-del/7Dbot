import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
})

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts(category = null) {
    const params = category ? { category } : {}
    const { data } = await api.get('/products', { params })
    return data
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function createOrder(payload) {
    const { data } = await api.post('/orders', payload)
    return data
}

export async function fetchOrder(orderId) {
    const { data } = await api.get(`/orders/${orderId}`)
    return data
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function fetchTransferDetails() {
    const { data } = await api.get('/settings/transfer')
    return data
}
