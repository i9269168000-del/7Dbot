import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function ProductCard({ product }) {
    const { addItem, decreaseItem, getQuantity } = useCart()
    const { t, lang } = useLang()
    const qty = getQuantity(product.id)

    const name = lang === 'ru' && product.name_ru ? product.name_ru : product.name

    return (
        <div className="product-card">
            {product.image_url ? (
                <img
                    className="product-card__img"
                    src={product.image_url}
                    alt={name}
                    loading="lazy"
                />
            ) : (
                <div className="product-card__img-placeholder">🛍️</div>
            )}
            <div className="product-card__body">
                <div className="product-card__name">{name}</div>
                <div className="product-card__price">
                    {t.thb}{product.sell_price_thb.toFixed(0)}
                </div>
                {qty === 0 ? (
                    <button
                        className="product-card__add"
                        onClick={() => addItem(product)}
                    >
                        + {t.addToCart}
                    </button>
                ) : (
                    <div className="product-card__qty">
                        <button
                            className="product-card__qty-btn"
                            onClick={() => decreaseItem(product.id)}
                        >
                            −
                        </button>
                        <span className="product-card__qty-count">{qty}</span>
                        <button
                            className="product-card__qty-btn"
                            onClick={() => addItem(product)}
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
