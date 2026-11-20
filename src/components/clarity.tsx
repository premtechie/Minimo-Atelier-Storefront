import Script from "next/script";
import { CLARITY_ID } from "@/lib/analytics";

/*
 * Clarity's standard loader. Analytics storage is granted and ad storage is
 * denied (Consent Mode v2), since Clarity here is for understanding the site,
 * not advertising. Typed text is masked by Clarity; phone, address and order
 * screens are also marked data-clarity-mask so they are never recorded.
 */
export function Clarity() {
  if (!CLARITY_ID) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_ID)});window.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});`}
    </Script>
  );
}
