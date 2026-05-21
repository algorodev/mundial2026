import Script from "next/script";

// GA4 vía gtag.js. Sólo se carga si NEXT_PUBLIC_GA4_ID está definido en el
// entorno (por defecto: no se carga en dev). El ID es público — va expuesto
// en el cliente porque así funciona Analytics.
export default function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA4_ID;
  if (!id) return null;

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
