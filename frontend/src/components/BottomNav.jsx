import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()
    const { totalCount } = useCart()
    const { t } = useLang()

    const items = [
        { path: '/', icon: '🏪', label: t.all },
        { path: '/cart', icon: '🛒', label: t.cartTitle, badge: totalCount },
    ]

    return (
        <nav className="bottom-nav">
            {items.map(item => (
                <button
                    key={item.path}
                    className={`bottom-nav__item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                    style={{ position: 'relative' }}
                >
                    <span style={{ fontSize: 22, position: 'relative' }}>
                        {item.icon}
                        {item.badge > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -8,
                                    background: 'var(--color-orange)',
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    borderRadius: 10,
                                    minWidth: 18,
                                    height: 18,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 4px',
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
