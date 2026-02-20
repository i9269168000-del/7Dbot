import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()
    const { totalCount } = useCart()
    const { t } = useLang()

    const items = [
        { path: '/', icon: '🏪', label: t.home || 'Home' },
        { path: '/browse', icon: '🔍', label: t.browse || 'Browse' },
        { path: '/orders', icon: '📦', label: t.orders || 'Orders' },
        { path: '/cart', icon: '🛒', label: t.cartTitle, badge: totalCount },
    ]

    return (
        <nav className="bottom-nav">
            {items.map(item => (
                <button
                    key={item.path}
                    className={`bottom-nav__item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                >
                    <span className="bottom-nav__icon">
                        {item.icon}
                        {item.badge > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -8,
                                    background: 'var(--color-orange)',
                                    color: 'white',
                                    fontSize: 9,
                                    fontWeight: 800,
                                    borderRadius: 10,
                                    minWidth: 16,
                                    height: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px',
                                    boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                                }}
                            >
                                {item.badge}
                            </span>
                        )}
                    </span>
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    )
}
