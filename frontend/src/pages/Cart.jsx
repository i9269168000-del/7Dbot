import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import StripeBar from '../components/StripeBar'
import BottomNav from '../components/BottomNav'
import CartItem from '../components/CartItem'

export default function Cart() {
    const { items, totalPrice, totalCount } = useCart()
    const { t } = useLang()
    const navigate = useNavigate()

    return (
        <>
            <Header />
            <StripeBar />
            <div className="page">
                <div className="section-title">{t.cartTitle}</div>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🛒</div>
                        <div className="empty-state__text">{t.cartEmpty}</div>
                        <div style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 4 }}>
                            {t.cartEmptyHint}
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: 20, width: 'auto', padding: '12px 28px' }}
                            onClick={() => navigate('/')}
                        >
                            🏪 {t.all}
                        </button>
                    </div>
                ) : (
                    <>
                        {items.map(item => (
                            <CartItem key={item.product.id} item={item} />
                        ))}

                        <div className="cart-total">
                            <div className="cart-total__row">
                                <span>{t.total} ({totalCount} {t.items})</span>
                                <span className="cart-total__amount">
                                    {t.thb}{totalPrice.toFixed(0)}
                                </span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ marginTop: 16 }}
                            onClick={() => navigate('/checkout')}
                        >
                            {t.checkout} →
                        </button>
                    </>
                )}
            </div>
            <BottomNav />
        </>
    )
}
