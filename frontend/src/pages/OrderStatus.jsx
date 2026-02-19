import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchOrder } from '../api'
import { useLang } from '../context/LangContext'
import Header from '../components/Header'
import StripeBar from '../components/StripeBar'
import BottomNav from '../components/BottomNav'

const STATUS_STEPS = ['new', 'paid', 'delivering', 'done']

const STATUS_ICONS = {
    new: '📋',
    paid: '✅',
    delivering: '🚴',
    done: '🎉',
}

export default function OrderStatus() {
    const { orderId } = useParams()
    const { t } = useLang()
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
        <>
            <Header />
            <StripeBar />
            <div className="page">
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
                        <div className="status-card">
                            <div className="status-icon">{STATUS_ICONS[order.status]}</div>
                            <div className="status-title">
                                {t.orderTitle} #{order.id}
                            </div>
                            <div className="status-subtitle">
                                {stepDescs[order.status]}
                            </div>
                        </div>

                        {/* Прогресс */}
                        <div className="status-steps">
                            {STATUS_STEPS.map((step, idx) => {
                                const isDone = idx < currentStep
                                const isCurrent = idx === currentStep
                                return (
                                    <div
                                        key={step}
                                        className={`status-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                                    >
                                        <div className="status-step__dot">
                                            {isDone ? '✓' : idx + 1}
                                        </div>
                                        <div className="status-step__label">{stepLabels[step]}</div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Инструкция по чеку для новых заказов */}
                        {order.status === 'new' && (
                            <div className="info-block" style={{ marginTop: 20 }}>
                                <strong>{t.sendReceipt}</strong>
                                <br />
                                {t.receiptHint}
                                <br />
                                <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}>
                                    #{order.id}
                                </span>
                            </div>
                        )}

                        <button
                            className="btn btn-secondary"
                            style={{ marginTop: 16 }}
                            onClick={() => navigate('/')}
                        >
                            ← {t.backToCatalog}
                        </button>
                    </>
                )}
            </div>
            <BottomNav />
        </>
    )
}
