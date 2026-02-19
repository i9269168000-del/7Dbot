import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function Header() {
    const { totalCount } = useCart()
    const { lang, toggleLang } = useLang()
    const navigate = useNavigate()
    const location = useLocation()

    const isHome = location.pathname === '/'

    return (
        <header className="header">
            <div className="header__left">
                {!isHome && (
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ←
                    </button>
                )}
                {/* Логотип в стиле 7-Eleven: цифра 7 + DELIVERY */}
                <div className="header__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <div className="logo-seven">
                        <span className="logo-seven__digit">7</span>
                        <span className="logo-seven__delivery">DELIVERY</span>
                    </div>
                </div>
            </div>
            <div className="header__actions">
                <button className="lang-toggle" onClick={toggleLang}>
                    {lang === 'en' ? 'RU' : 'EN'}
                </button>
                <button className="cart-btn" onClick={() => navigate('/cart')}>
                    🛒
                    {totalCount > 0 && (
                        <span className="cart-btn__badge">{totalCount}</span>
                    )}
                </button>
            </div>
        </header>
    )
}
