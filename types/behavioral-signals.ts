/**
 * Extension point for deterministic page/phishing behavioral checks (planned).
 * When implemented, wire each flag from HTML/session analysis near fetchWebsiteSignals.
 */

export interface PendingPageBehaviorSignals {
  loginFormDetected?: boolean;
  paymentFormDetected?: boolean;
  passwordFieldDetected?: boolean;
  suspiciousBrandImageryDetected?: boolean;
  suspiciousRedirectsDetected?: boolean;
  heavilyObfuscatedScriptDetected?: boolean;
  mismatchedTitleOrFaviconSuspected?: boolean;
  suspiciousIframeDetected?: boolean;
  cryptoWalletConnectSuspected?: boolean;
  urgentAccountLanguageDetected?: boolean;
}
