import { useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'

export default function Header() {
    const { totalCount } = useCart()
    const { lang, toggleLang } = useLang()
    const navigate = useNavigate()
    const location = useLocation()

    const isHome = location.pathname === '/'
    
    // Получаем данные пользователя из Telegram (если доступно)
    const tg = window.Telegram?.WebApp
    const user = tg?.initDataUnsafe?.user
    const userInitial = user?.first_name ? user.first_name[0].toUpperCase() : 'U'

    return (
        <header className="header">
            <div className="header__left">
                {!isHome ? (
                    <button className="back-btn" onClick={() => navigate(-1)} style={{ fontSize: '20px', color: 'var(--text-black)' }}>
                        ←
                    </button>
                ) : (
                    <div className="user-avatar">
                        {userInitial}
                    </div>
                )}
                
                <div className="address-selector">
                    <span className="address-selector__label">{lang === 'en' ? 'Deliver to' : 'Доставка'}</span>
                    <span className="address-selector__value">
                        Current Location <span style={{ fontSize: '10px' }}>▼</span>
                    </span>
                </div>
            </div>

            <div className="header__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <span className="logo-seven-sm">7</span>
            </div>

            <div className="header__actions">
                <button className="search-btn" onClick={() => console.log('Search clicked')}>
                    🔍
                </button>
                <button className="lang-toggle" onClick={toggleLang} style={{ fontWeight: 700, fontSize: '12px' }}>
                    {lang === 'en' ? 'RU' : 'EN'}
                </button>
            </div>
        </header>
    )
}
