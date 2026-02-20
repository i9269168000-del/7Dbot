import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function ProductCard({ product }) {
    const { addItem, decreaseItem, getQuantity } = useCart()
    const { t, lang } = useLang()
    const navigate = useNavigate()
    const qty = getQuantity(product.id)

    const name = lang === 'ru' && product.name_ru ? product.name_ru : product.name

    const handleCardClick = (e) => {
        // Если кликнули на кнопку добавления/удаления, не переходим
        if (e.target.closest('button')) return
        navigate(`/product/${product.id}`)
    }

    return (
        <div className="product-card" onClick={handleCardClick}>
            <div className="product-card__img-container">
                {product.is_hot && (
                    <div className="product-card__badge">HOT</div>
                )}
                {product.image_url ? (
                    <img
                        className="product-card__img"
                        src={product.image_url}
                        alt={name}
                        loading="lazy"
                    />
                ) : (
                    <div style={{ fontSize: '40px' }}>🛍️</div>
                )}
            </div>

            <div className="product-card__body">
                <div className="product-card__name">{name}</div>
                <div className="product-card__footer">
                    <div className="product-card__price">
                        ฿{product.sell_price_thb.toFixed(0)}
                    </div>

                    {qty === 0 ? (
                        <button
                            className="product-card__add"
                            onClick={(e) => {
                                e.stopPropagation()
                                addItem(product)
                            }}
                        >
                            {t.add || 'Add'}
                        </button>
                    ) : (
                        <div className="product-card__qty" onClick={(e) => e.stopPropagation()}>
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
        </div>
    )
}
