import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder, fetchTransferDetails } from '../api'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

// ⚠️ Крипто-кошельки — укажи свои адреса:
const CRYPTO_WALLETS = [
    { label: 'USDT TRC-20 (Tron)', address: 'TFWqNpHmj5cgRreHUksQnQq6cWFYiHxMWg' },
    { label: 'USDT BEP-20 (BSC)', address: '0x645f80657627811919019188b13b89d742ba540a' },
]

export default function Checkout() {
    const { items, totalPrice, totalCount, clearCart } = useCart()
    const { t, lang } = useLang()
    const navigate = useNavigate()

    const [address, setAddress] = useState('')
    const [contactInfo, setContactInfo] = useState('')
    const [mapsUrl, setMapsUrl] = useState('')
    const [payment, setPayment] = useState('transfer')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [copied, setCopied] = useState(null)

    // Реквизиты перевода из backend
    const [transferDetails, setTransferDetails] = useState(null)

    useEffect(() => {
        fetchTransferDetails()
            .then(setTransferDetails)
            .catch(() => { }) // не блокируем если backend недоступен
    }, [])

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    const telegramId = tgUser?.id || 0
    const username = tgUser?.username || null
    const firstName = tgUser?.first_name || null

    function copyToClipboard(text, idx) {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(idx)
            setTimeout(() => setCopied(null), 2000)
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!address.trim()) return
        if (items.length === 0) return

        setLoading(true)
        setError(null)

        try {
            const payload = {
                telegram_id: telegramId,
                username,
                first_name: firstName,
                address: address.trim(),
                contact_info: contactInfo.trim() || null,
                maps_url: mapsUrl.trim() || null,
                payment_method: payment,
                items: items.map(i => ({
                    product_id: i.product.id,
                    quantity: i.quantity,
                    options: i.options || null
                })),
            }

            const order = await createOrder(payload)
            clearCart()
            navigate(`/order/${order.id}`)
        } catch (err) {
            setError(lang === 'en' ? 'Order creation failed' : 'Ошибка создания заказа')
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        navigate('/')
        return null
    }

    return (
        <div className="page" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <Header />

            <div style={{ padding: '0 20px', paddingBottom: '120px' }}>
                <h1 className="section-title" style={{ marginTop: '24px', fontSize: '24px', fontWeight: 800 }}>
                    {t.checkoutTitle || (lang === 'en' ? 'Checkout' : 'Оформление')}
                </h1>

                {/* Состав заказа */}
                <div className="checkout-summary" style={{
                    background: 'var(--color-surface)',
                    padding: '16px',
                    borderRadius: '16px',
                    marginBottom: '24px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {t.orderSummary}:
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '15px', lineHeight: '1.4' }}>
                        {items.map(i => {
                            const name = lang === 'ru' && i.product.name_ru ? i.product.name_ru : i.product.name
                            return `${name} x${i.quantity}`
                        }).join(', ')}
                    </div>
                    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{t.total}:</span>
                        <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--color-green)' }}>
                            ฿{totalPrice.toFixed(0)}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Адрес */}
                    <div className="form-group">
                        <label className="form-label">{t.deliveryAddress}</label>
                        <textarea
                            className="form-textarea"
                            placeholder={t.addressPlaceholder}
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            required
                        />
                    </div>

                    {/* Контактная информация */}
                    <div className="form-group">
                        <label className="form-label">{lang === 'en' ? 'Contact Info (optional)' : 'Контактные данные (необязательно)'}</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={lang === 'en' ? 'Phone or Telegram' : 'Телефон или Telegram'}
                            value={contactInfo}
                            onChange={e => setContactInfo(e.target.value)}
                        />
                    </div>

                    {/* Google Maps */}
                    <div className="form-group">
                        <label className="form-label">{t.googleMapsLabel}</label>
                        <input
                            type="url"
                            className="form-input"
                            placeholder={t.googleMapsPlaceholder}
                            value={mapsUrl}
                            onChange={e => setMapsUrl(e.target.value)}
                        />
                    </div>

                    {/* Способ оплаты */}
                    <div className="form-group">
                        <label className="form-label">{t.paymentMethod}</label>
                        <div className="payment-options">
                            <div
                                className={`payment-option ${payment === 'transfer' ? 'selected' : ''}`}
                                onClick={() => setPayment('transfer')}
                            >
                                <span className="payment-option__icon">🏦</span>
                                <div className="payment-option__info">
                                    <div className="payment-option__title">{t.transfer}</div>
                                    <div className="payment-option__desc">{t.transferDesc}</div>
                                </div>
                                <div className="payment-option__radio" />
                            </div>

                            <div
                                className={`payment-option ${payment === 'crypto' ? 'selected' : ''}`}
                                onClick={() => setPayment('crypto')}
                            >
                                <span className="payment-option__icon">💎</span>
                                <div className="payment-option__info">
                                    <div className="payment-option__title">{t.crypto}</div>
                                    <div className="payment-option__desc">{t.cryptoDesc}</div>
                                </div>
                                <div className="payment-option__radio" />
                            </div>
                        </div>
                    </div>

                    {/* Реквизиты перевода на карту РФ */}
                    {payment === 'transfer' && (
                        <div className="transfer-details">
                            <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>{t.transferDetailsTitle}</h2>

                            {transferDetails?.qr_image_url && (
                                <div className="transfer-details__qr">
                                    <img
                                        src={transferDetails.qr_image_url}
                                        alt="QR для оплаты"
                                        className="transfer-details__qr-img"
                                    />
                                </div>
                            )}

                            <div className="transfer-info-card">
                                {transferDetails?.bank && (
                                    <div className="transfer-row">
                                        <span className="transfer-label">🏦 Bank</span>
                                        <span className="transfer-value">{transferDetails.bank}</span>
                                    </div>
                                )}

                                {transferDetails?.phone && (
                                    <div className="transfer-row">
                                        <span className="transfer-label">📱 Phone (SBP)</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="transfer-value">{transferDetails.phone}</span>
                                            <button
                                                type="button"
                                                className="copy-btn-inner"
                                                onClick={() => copyToClipboard(transferDetails.phone, 'phone')}
                                            >
                                                {copied === 'phone' ? '✓' : '📋'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!transferDetails?.phone && !transferDetails?.bank && !transferDetails?.qr_image_url && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '10px' }}>
                                        Admin will provide details soon
                                    </div>
                                )}
                            </div>

                            <div className="transfer-hint">
                                <span style={{ fontSize: '18px' }}>ℹ️</span>
                                <p>{t.transferInfo}</p>
                            </div>
                        </div>
                    )}

                    {/* Реквизиты крипты */}
                    {payment === 'crypto' && (
                        <div className="crypto-section">
                            <h2 className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>{t.cryptoWalletTitle}</h2>
                            {CRYPTO_WALLETS.map((w, idx) => (
                                <div key={idx} className="crypto-wallet-card">
                                    <div className="crypto-wallet-label">{w.label}</div>
                                    <div className="crypto-wallet-row">
                                        <span className="crypto-wallet-address">{w.address}</span>
                                        <button
                                            type="button"
                                            className="copy-btn-inner"
                                            onClick={() => copyToClipboard(w.address, idx)}
                                        >
                                            {copied === idx ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="error-banner">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="buy-btn"
                        style={{ marginTop: '32px', width: '100%', height: '56px' }}
                        disabled={loading || !address.trim()}
                    >
                        {loading ? <div className="spinner-sm"></div> : t.placeOrder}
                    </button>
                </form>
            </div>

            <BottomNav />
        </div>
    )
}
