import { createContext, useContext, useState } from 'react'
import en from '../locales/en'
import ru from '../locales/ru'

const locales = { en, ru }

const LangContext = createContext(null)

function detectLang() {
    // 1. Из localStorage
    const saved = localStorage.getItem('lang')
    if (saved === 'en' || saved === 'ru') return saved
    // 2. Из Telegram WebApp
    try {
        const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
        if (tgLang && tgLang.startsWith('ru')) return 'ru'
    } catch (_) { }
    return 'en'
}

export function LangProvider({ children }) {
    const [lang, setLang] = useState(detectLang)

    function toggleLang() {
        const next = lang === 'en' ? 'ru' : 'en'
        setLang(next)
        localStorage.setItem('lang', next)
    }

    const t = locales[lang]

    return (
        <LangContext.Provider value={{ lang, toggleLang, t }}>
            {children}
        </LangContext.Provider>
    )
}

export function useLang() {
    return useContext(LangContext)
}
