import { createContext, useContext, useState } from 'react'
import { Lang, TKey, getT } from '../i18n'
import { storageGet, storageSet } from '../utils/storage'

interface LangCtx {
  lang: Lang
  toggleLang: () => void
  t: (key: TKey) => string
}

const Ctx = createContext<LangCtx>(null!)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => storageGet<Lang>('tm_lang', 'es'))

  const toggleLang = () => {
    const next: Lang = lang === 'es' ? 'en' : 'es'
    setLang(next)
    storageSet('tm_lang', next)
  }

  return <Ctx.Provider value={{ lang, toggleLang, t: getT(lang) }}>{children}</Ctx.Provider>
}

export function useLanguage() {
  return useContext(Ctx)
}
