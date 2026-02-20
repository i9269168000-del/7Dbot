import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

export default function ProductDetail() {
    const { productId } = useParams()
    const navigate = useNavigate()
    const { addItem, getQuantity } = useCart()
    const { t, lang } = useLang()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [heatUp, setHeatUp] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const resp = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${productId}`)
                setProduct(resp.data)
            } catch (err) {
                console.error('Failed to fetch product:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [productId])

    if (loading) return <div className="loading"><div className="spinner"></div></div>
    if (!product) return <div className="page">Product not found</div>

    const name = lang === 'ru' && product.name_ru ? product.name_ru : product.name
    const qty = getQuantity(product.id)

    return (
        <div className="page product-detail">
            <Header />

            <div className="product-detail__img-hero">
                {product.image_url ? (
                    <img src={product.image_url} alt={name} />
                ) : (
                    <div style={{ fontSize: '100px' }}>🛍️</div>
                )}
            </div>

            <div className="product-detail__content">
                <h1 className="product-detail__name">{name}</h1>

                <div className="product-detail__badges">
                    {product.is_hot && (
                        <span className="detail-badge detail-badge--hot">🔥 {lang === 'en' ? 'Hot' : 'Горячее'}</span>
                    )}
                    {product.calories > 0 && (
                        <span className="detail-badge detail-badge--cal">⚡ {product.calories} kcal</span>
                    )}
                </div>

                <div className="product-card__price" style={{ fontSize: '24px', marginBottom: '20px' }}>
                    ฿{product.sell_price_thb.toFixed(0)}
                </div>

                {product.is_hot && (
                    <div className="product-detail__section">
                        <div className="option-toggle">
                            <span className="section-title" style={{ margin: 0 }}>
                                {lang === 'en' ? 'Heat it up' : 'Разогреть'}
                            </span>
                            <input
                                type="checkbox"
                                checked={heatUp}
                                onChange={(e) => setHeatUp(e.target.checked)}
                                style={{ width: '24px', height: '24px', accentColor: 'var(--color-green)' }}
                            />
                        </div>
                    </div>
                )}

                {(product.calories > 0 || product.proteins > 0) && (
                    <div className="product-detail__section">
                        <h2 className="section-title">{lang === 'en' ? 'Nutrition Facts' : 'КБЖУ'}</h2>
                        <div className="nutrition-grid">
                            <div className="nutrition-item">
                                <div className="nutrition-item__val">{product.calories}</div>
                                <div className="nutrition-item__label">Kcal</div>
                            </div>
                            <div className="nutrition-item">
                                <div className="nutrition-item__val">{product.proteins}g</div>
                                <div className="nutrition-item__label">Prot</div>
                            </div>
                            <div className="nutrition-item">
                                <div className="nutrition-item__val">{product.fats}g</div>
                                <div className="nutrition-item__label">Fats</div>
                            </div>
                            <div className="nutrition-item">
                                <div className="nutrition-item__val">{product.carbs}g</div>
                                <div className="nutrition-item__label">Carbs</div>
                            </div>
                        </div>
                    </div>
                )}

                {product.ingredients && (
                    <div className="product-detail__section">
                        <h2 className="section-title">{lang === 'en' ? 'Ingredients' : 'Состав'}</h2>
                        <p className="ingredients-text">{product.ingredients}</p>
                    </div>
                )}
            </div>

            <div className="bottom-action">
                <button
                    className="buy-btn"
                    onClick={() => {
                        addItem(product, heatUp ? { heat_up: true } : null)
                        navigate('/cart')
                    }}
                >
                    {lang === 'en' ? 'Buy Now' : 'Купить сейчас'}
                </button>
            </div>

            <BottomNav />
        </div>
    )
}
