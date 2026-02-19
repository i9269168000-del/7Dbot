import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder, fetchTransferDetails } from '../api'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import StripeBar from '../components/StripeBar'
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
                maps_url: mapsUrl.trim() || null,
                payment_method: payment,
                items: items.map(i => ({
                    product_id: i.product.id,
                    quantity: i.quantity,
                })),
            }

            const order = await createOrder(payload)
            clearCart()
            navigate(`/order/${order.id}`)
        } catch (err) {
            setError(t.error)
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        navigate('/')
        return null
    }

    return (
        <>
            <Header />
            <StripeBar />
            <div className="page">
                <div className="section-title">{t.checkoutTitle}</div>

                {/* Состав заказа */}
                <div className="info-block">
                    <strong>{t.orderSummary}:</strong>{' '}
                    {items.map(i => {
                        const name = lang === 'ru' && i.product.name_ru ? i.product.name_ru : i.product.name
                        return `${name} ×${i.quantity}`
                    }).join(', ')}
                    <br />
                    <strong>{t.total}:</strong> {t.thb}{totalPrice.toFixed(0)} ({totalCount} {t.items})
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
                            <div className="transfer-details__title">{t.transferDetailsTitle}</div>

                            {/* QR-код */}
                            {transferDetails?.qr_image_url && (
                                <div className="transfer-details__qr">
                                    <img
                                        src={transferDetails.qr_image_url}
                                        alt="QR для оплаты"
                                        className="transfer-details__qr-img"
                                    />
                                </div>
                            )}

                            {/* Банк */}
                            {transferDetails?.bank && (
                                <div className="transfer-details__row">
                                    <span className="transfer-details__label">🏦 Банк</span>
                                    <span className="transfer-details__value">{transferDetails.bank}</span>
                                </div>
                            )}

                            {/* Телефон */}
                            {transferDetails?.phone && (
                                <div className="transfer-details__row">
                                    <span className="transfer-details__label">📱 Телефон (СБП)</span>
                                    <div className="transfer-details__phone-row">
                                        <span className="transfer-details__value">{transferDetails.phone}</span>
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            onClick={() => copyToClipboard(transferDetails.phone, 'phone')}
                                        >
                                            {copied === 'phone' ? '✓' : '📋'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Если реквизиты ещё не заданы */}
                            {!transferDetails?.phone && !transferDetails?.bank && !transferDetails?.qr_image_url && (
                                <div className="transfer-details__empty">
                                    Реквизиты будут добавлены администратором
                                </div>
                            )}

                            <div className="transfer-details__hint">{t.transferInfo}</div>
                        </div>
                    )}

                    {/* Реквизиты крипты */}
                    {payment === 'crypto' && (
                        <div className="crypto-wallets">
                            <div className="crypto-wallets__title">{t.cryptoWalletTitle}</div>
                            {CRYPTO_WALLETS.map((w, idx) => (
                                <div key={idx} className="crypto-wallet-item">
                                    <div className="crypto-wallet-item__label">{w.label}</div>
                                    <div className="crypto-wallet-item__row">
                                        <code className="crypto-wallet-item__address">{w.address}</code>
                                        <button
                                            type="button"
                                            className="copy-btn"
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
                        <div className="info-block" style={{ color: 'var(--color-red)', background: '#fff0f0' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !address.trim()}
                    >
                        {loading ? '...' : t.placeOrder}
                    </button>
                </form>
            </div>
            <BottomNav />
        </>
    )
}
