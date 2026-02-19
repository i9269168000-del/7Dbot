import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [items, setItems] = useState([]) // [{ product, quantity }]

    function addItem(product) {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id)
            if (existing) {
                return prev.map(i =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    function removeItem(productId) {
        setItems(prev => prev.filter(i => i.product.id !== productId))
    }

    function decreaseItem(productId) {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === productId)
            if (!existing) return prev
            if (existing.quantity === 1) return prev.filter(i => i.product.id !== productId)
            return prev.map(i =>
                i.product.id === productId
                    ? { ...i, quantity: i.quantity - 1 }
                    : i
            )
        })
    }

    function clearCart() {
        setItems([])
    }

    function getQuantity(productId) {
        return items.find(i => i.product.id === productId)?.quantity || 0
    }

    const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalPrice = items.reduce(
        (sum, i) => sum + i.product.sell_price_thb * i.quantity,
        0
    )

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            decreaseItem,
            clearCart,
            getQuantity,
            totalCount,
            totalPrice,
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    return useContext(CartContext)
}
