import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function CartItem({ item }) {
    const { addItem, decreaseItem, removeItem } = useCart()
    const { t, lang } = useLang()
    const { product, quantity } = item

    const name = lang === 'ru' && product.name_ru ? product.name_ru : product.name
    const lineTotal = (product.sell_price_thb * quantity).toFixed(0)

    return (
        <div className="cart-item">
            {product.image_url ? (
                <img
                    className="cart-item__img"
                    src={product.image_url}
                    alt={name}
                />
            ) : (
                <div className="cart-item__img-placeholder">🛍️</div>
            )}
            <div className="cart-item__info">
                <div className="cart-item__name">{name}</div>
                <div className="cart-item__price">
                    {t.thb}{product.sell_price_thb.toFixed(0)} × {quantity} = {t.thb}{lineTotal}
                </div>
            </div>
            <div className="cart-item__controls">
                <button className="qty-btn" onClick={() => decreaseItem(product.id)}>−</button>
                <span className="qty-count">{quantity}</span>
                <button className="qty-btn" onClick={() => addItem(product)}>+</button>
            </div>
        </div>
    )
}
