import { useEffect, useState } from 'react'
import { fetchProducts } from '../api'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import StripeBar from '../components/StripeBar'
import BottomNav from '../components/BottomNav'
import ProductCard from '../components/ProductCard'

const CATEGORIES = ['all', 'food', 'drinks', 'snacks', 'bakery', 'dairy', 'frozen', 'household']

export default function Catalog() {
    const { t } = useLang()
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
        <>
            <Header />
            <StripeBar />

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
                    <div className="empty-state__text">{t.error}</div>
                    <button
                        className="btn btn-primary"
                        style={{ marginTop: 12, width: 'auto', padding: '10px 24px' }}
                        onClick={() => setCategory(category)}
                    >
                        {t.retry}
                    </button>
                </div>
            )}

            {!loading && !error && products.length === 0 && (
                <div className="empty-state">
                    <div className="empty-state__icon">📦</div>
                    <div className="empty-state__text">{t.cartEmpty}</div>
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
        </>
    )
}
