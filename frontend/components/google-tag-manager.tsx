import Script from "next/script";

interface GoogleTagManagerProps {
  gtmId: string;
  nonce?: string;
}

export function GoogleTagManager({
  gtmId,
  nonce,
}: Readonly<GoogleTagManagerProps>) {
  return (
    <>
      <Script
        id="_next-gtm-init"
        strategy="afterInteractive"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}

            (function() {
              try {
                var url = new URL(window.location.href);
                var sensitiveParams = ['token', 'access_token', 'resetToken', 'email', 'code'];
                sensitiveParams.forEach(function(param) {
                  if (url.searchParams.has(param)) {
                    url.searchParams.set(param, '[REDACTED]');
                  }
                });
                window.dataLayer.push({ 'page_location_clean': url.toString() });
              } catch (e) {}
            })();

            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });

            window.dataLayer.push({
              'gtm.start': new Date().getTime(),
              event: 'gtm.js'
            });
          `,
        }}
      />
      <Script
        id="_next-gtm"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`}
        nonce={nonce}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
          height="0"
          width="0"
          title="Google Tag Manager"
          hidden
          aria-hidden="true"
        />
      </noscript>
    </>
  );
}
