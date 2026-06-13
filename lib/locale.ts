import { cookies } from 'next/headers'

export type Locale = 'es' | 'en'
export const LOCALES: readonly Locale[] = ['es', 'en']
export const DEFAULT_LOCALE: Locale = 'es'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const val = cookieStore.get('locale')?.value
  return (LOCALES as readonly string[]).includes(val ?? '') ? (val as Locale) : DEFAULT_LOCALE
}
