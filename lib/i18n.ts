import es from '@/messages/es.json'
import en from '@/messages/en.json'

export type Dictionary = typeof es
export type Locale = 'es' | 'en'

const dicts = { es, en } as const

export function getDictionary(locale: Locale): Dictionary {
  return dicts[locale] as Dictionary
}
