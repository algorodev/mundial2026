"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_EVENT,
  readConsent,
  type ConsentValue,
} from "./CookieBanner";

// GA4 vía gtag.js. Sólo se carga si NEXT_PUBLIC_GA4_ID está definido y el
// usuario ha aceptado cookies analíticas. El ID es público — va expuesto
// en el cliente porque así funciona Analytics.
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA4_ID;
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<ConsentValue>).detail;
      setConsent(detail);
    }
    window.addEventListener(COOKIE_CONSENT_EVENT, onChange);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onChange);
  }, []);

  if (!id) return null;
  if (consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
