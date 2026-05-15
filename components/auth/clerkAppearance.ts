/** Minimal Fraudly styling for unified Clerk auth (sign-in + sign-up on one surface). */
export const fraudlyClerkAppearance = {
  variables: {
    colorPrimary: "#2563eb",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    borderRadius: "0.75rem"
  },
  elements: {
    card: "shadow-subtle border border-slate-200/90 rounded-2xl",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "fraudly-motion border border-slate-200/90 bg-white text-slate-900 hover:bg-slate-50 font-semibold min-h-11",
    formButtonPrimary: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-105",
    footerAction: "hidden",
    footerActionLink: "hidden"
  }
};
