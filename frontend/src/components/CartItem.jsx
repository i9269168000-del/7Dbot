import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function CartItem({ item }) {
    const { addItem, decreaseItem } = useCart()
    const { t, lang } = useLang()
    const { product, quantity } = item

    const name = lang === 'ru' && product.name_ru ? product.name_ru : product.name

    return (
        <div className="cart-item">
            <div className="cart-item__img">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={name}
                    />
                ) : (
                    <div style={{ fontSize: '32px' }}>🛍️</div>
                )}
            </div>

            <div className="cart-item__info">
                <div className="cart-item__name">{name}</div>
                <div className="cart-item__price">
                    ฿{product.sell_price_thb.toFixed(0)}
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
