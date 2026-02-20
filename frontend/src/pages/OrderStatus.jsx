import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrder } from '../api'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'

const STATUS_STEPS = ['new', 'paid', 'delivering', 'done']

const STATUS_ICONS = {
    new: '📋',
    paid: '💎',
    delivering: '🚴',
    done: '🎉',
}

export default function OrderStatus() {
    const { orderId } = useParams()
    const { t, lang } = useLang()
    const navigate = useNavigate()

    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let interval

        function load() {
            fetchOrder(orderId)
                .then(setOrder)
                .catch(() => setError(true))
                .finally(() => setLoading(false))
        }

        load()
        // Автообновление каждые 15 секунд
        interval = setInterval(load, 15000)
        return () => clearInterval(interval)
    }, [orderId])

    const currentStep = order ? STATUS_STEPS.indexOf(order.status) : 0

    const stepLabels = {
        new: t.statusNew,
        paid: t.statusPaid,
        delivering: t.statusDelivering,
        done: t.statusDone,
    }

    const stepDescs = {
        new: t.statusNewDesc,
        paid: t.statusPaidDesc,
        delivering: t.statusDeliveringDesc,
        done: t.statusDoneDesc,
    }

    return (
        <div className="page" style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
            <Header />

            <div style={{ padding: '0 20px', paddingBottom: '120px' }}>
                <h1 className="section-title" style={{ marginTop: '24px', fontSize: '24px', fontWeight: 800 }}>
                    {t.orderTitle || (lang === 'en' ? 'Order Status' : 'Статус заказа')}
                </h1>

                {loading && (
                    <div className="loading"><div className="spinner" /></div>
                )}

                {error && (
                    <div className="empty-state">
                        <div className="empty-state__icon">⚠️</div>
                        <div className="empty-state__text">{t.error}</div>
                    </div>
                )}

                {order && (
                    <>
                        <div className="order-status-card">
                            <div className="order-status-card__header">
                                <div className="status-badge-icon">{STATUS_ICONS[order.status]}</div>
                                <div className="order-id-tag">#{order.id}</div>
                            </div>
                            <h2 className="order-status-card__title">
                                {stepLabels[order.status]}
                            </h2>
                            <p className="order-status-card__desc">
                                {stepDescs[order.status]}
                            </p>
                        </div>

                        {/* Прогресс */}
                        <div className="stepper">
                            {STATUS_STEPS.map((step, idx) => {
                                const isDone = idx < currentStep
                                const isCurrent = idx === currentStep
                                return (
                                    <div
                                        key={step}
                                        className={`stepper__step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                                    >
                                        <div className="stepper__dot">
                                            {isDone ? '✓' : idx + 1}
                                        </div>
                                        <div className="stepper__label">{stepLabels[step]}</div>
                                        {idx < STATUS_STEPS.length - 1 && <div className="stepper__line" />}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Инструкция по чеку для новых заказов */}
                        {order.status === 'new' && (
                            <div className="instruction-box">
                                <div style={{ fontSize: '24px' }}>🛡️</div>
                                <div className="instruction-box__content">
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{t.sendReceipt}</h3>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
                                        {t.receiptHint}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                            <button
                                className="buy-btn"
                                style={{ width: '100%', height: '56px' }}
                                onClick={() => navigate('/')}
                            >
                                {lang === 'en' ? 'Back to Shop' : 'В магазин'}
                            </button>
                            <button
                                className="btn-secondary"
                                style={{
                                    width: '100%',
                                    height: '56px',
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)',
                                    borderRadius: '12px',
                                    fontWeight: 700
                                }}
                                onClick={() => window.Telegram?.WebApp?.close()}
                            >
                                {lang === 'en' ? 'Close App' : 'Закрыть'}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <BottomNav />
        </div>
    )
}
