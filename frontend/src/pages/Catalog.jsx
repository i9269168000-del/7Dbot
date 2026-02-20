import { useEffect, useState } from 'react'
import { fetchProducts } from '../api'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import ProductCard from '../components/ProductCard'

const CATEGORIES = ['all', 'food', 'drinks', 'snacks', 'bakery', 'dairy', 'frozen', 'household']

export default function Catalog() {
    const { t, lang } = useLang()
    const [products, setProducts] = useState([])
    const [category, setCategory] = useState('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true)
        setError(null)
        fetchProducts(category === 'all' ? null : category)
            .then(setProducts)
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [category])

    return (
        <div className="page">
            <Header />

            <div className="category-tabs">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {t[cat] || cat}
                    </button>
                ))}
            </div>

            {loading && (
                <div className="loading">
                    <div className="spinner" />
                </div>
            )}

            {error && (
                <div className="empty-state">
                    <div className="empty-state__icon">⚠️</div>
                    <div className="empty-state__text">{lang === 'en' ? 'Unable to load products' : 'Ошибка загрузки товаров'}</div>
                    <button
                        className="buy-btn"
                        style={{ marginTop: 20, width: 'auto', padding: '12px 32px' }}
                        onClick={() => setCategory(category)}
                    >
                        {t.retry || 'Retry'}
                    </button>
                </div>
            )}

            {!loading && !error && products.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">📦</div>
                    <div className="empty-state__text">{lang === 'en' ? 'No products in this category' : 'В этой категории пусто'}</div>
                </div>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="product-grid">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            <BottomNav />
        </div>
    )
}
