import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import CartItem from '../components/CartItem'

export default function Cart() {
    const { items, totalPrice, totalCount } = useCart()
    const { t, lang } = useLang()
    const navigate = useNavigate()

    return (
        <div className="page" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <Header />

            <div style={{ padding: '0 20px', paddingBottom: '120px' }}>
                <h1 className="section-title" style={{ marginTop: '24px', fontSize: '24px', fontWeight: 800 }}>
                    {t.cartTitle || (lang === 'en' ? 'My Cart' : 'Корзина')}
                </h1>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state__icon">🛒</div>
                        <div className="empty-state__text">
                            {lang === 'en' ? 'Your cart is empty' : 'Корзина пуста'}
                        </div>
                        <div className="empty-state__sub">
                            {lang === 'en'
                                ? "Looks like you haven't added anything yet."
                                : "Похоже, вы еще ничего не добавили."}
                        </div>
                        <button
                            className="buy-btn"
                            style={{ marginTop: 24, width: '200px' }}
                            onClick={() => navigate('/')}
                        >
                            {lang === 'en' ? 'Go Shopping' : 'В каталог'}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="cart-items" style={{ marginBottom: '32px' }}>
                            {items.map(item => (
                                <CartItem key={item.product.id} item={item} />
                            ))}
                        </div>

                        <div className="cart-total">
                            <div className="cart-total__row">
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {lang === 'en' ? 'Subtotal' : 'Итого'} ({totalCount})
                                </span>
                                <span className="cart-total__amount" style={{ fontSize: '22px', fontWeight: 800 }}>
                                    ฿{totalPrice.toFixed(0)}
                                </span>
                            </div>
                        </div>

                        <button
                            className="buy-btn"
                            style={{
                                marginTop: 40,
                                width: '100%',
                                height: '56px',
                                background: 'var(--color-green)',
                                boxShadow: 'var(--shadow-glow)'
                            }}
                            onClick={() => navigate('/checkout')}
                        >
                            {lang === 'en' ? 'Checkout' : 'Оформить заказ'} →
                        </button>
                    </>
                )}
            </div>

            <BottomNav />
        </div>
    )
}
