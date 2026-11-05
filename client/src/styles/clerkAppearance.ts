import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/react-router";

// Shared look for <SignIn /> and <SignUp />, matching designs/login.html.
// Values point at the CSS variables in theme.css so there is one source of
// truth for the colors.
export const clerkAppearance: ComponentProps<typeof SignIn>["appearance"] = {
  variables: {
    colorPrimary: "var(--gold)",
    colorPrimaryForeground: "var(--ink)",
    colorDanger: "var(--error)",
    colorBackground: "transparent",
    colorForeground: "var(--ivory)",
    colorMutedForeground: "var(--stone)",
    colorInput: "var(--surface)",
    colorInputForeground: "var(--ivory)",
    colorBorder: "var(--line)",
    colorRing: "rgba(201, 164, 92, 0.14)",
    fontFamily: "var(--font-body)",
    fontFamilyButtons: "var(--font-body)",
    borderRadius: "14px",
  },
  elements: {
    // Clerk's card sits directly on the dark page, with no box around it.
    rootBox: { width: "100%" },
    cardBox: {
      width: "100%",
      maxWidth: "none",
      boxShadow: "none",
      border: "none",
      background: "transparent",
    },
    card: {
      padding: 0,
      gap: "24px",
      boxShadow: "none",
      border: "none",
      background: "transparent",
    },
    footer: { background: "transparent" },

    headerTitle: {
      fontFamily: "var(--font-display)",
      fontWeight: 500,
      fontSize: "40px",
      lineHeight: 1.08,
      color: "var(--ivory)",
    },
    headerSubtitle: { fontSize: "16px", color: "var(--stone)" },

    formFieldLabel: { fontSize: "14px", fontWeight: 500, color: "var(--ivory)" },
    formFieldInput: {
      height: "56px",
      padding: "0 18px",
      borderRadius: "14px",
      border: "1px solid var(--line)",
      background: "var(--surface)",
      color: "var(--ivory)",
      fontSize: "17px",
      textAlign: "center",
      boxShadow: "none",
      "&::placeholder": { color: "var(--placeholder)" },
      "&:focus": {
        borderColor: "var(--gold)",
        boxShadow: "0 0 0 4px rgba(201, 164, 92, 0.14)",
      },
      "&[aria-invalid='true']": { border: "1.5px solid var(--error)" },
    },
    formFieldHintText: { fontSize: "14px", color: "var(--stone)" },
    formFieldErrorText: {
      justifyContent: "center",
      fontSize: "14px",
      lineHeight: 1.45,
      color: "var(--error)",
    },

    formButtonPrimary: {
      height: "58px",
      borderRadius: "16px",
      border: 0,
      background: "var(--gold)",
      color: "var(--ink)",
      fontSize: "17px",
      fontWeight: 600,
      textTransform: "none",
      boxShadow: "none",
      "&:hover": { background: "var(--gold)" },
      "&:active, &[data-loading]": { background: "var(--gold-pressed)" },
    },

    // 6-digit email code boxes.
    otpCodeFieldInputs: { gap: "8px", justifyContent: "center" },
    otpCodeFieldInput: {
      width: "48px",
      height: "60px",
      padding: 0,
      borderRadius: "12px",
      border: "1px solid var(--line)",
      background: "var(--surface)",
      color: "var(--ivory)",
      fontSize: "24px",
      fontWeight: 500,
      boxShadow: "none",
      "&:focus": {
        border: "1.5px solid var(--gold)",
        boxShadow: "0 0 0 4px rgba(201, 164, 92, 0.14)",
      },
      "@media (min-width: 900px)": {
        width: "56px",
        height: "68px",
        fontSize: "26px",
      },
    },
    otpCodeFieldErrorText: { color: "var(--error)" },
    formResendCodeLink: { color: "var(--gold)", fontWeight: 500 },

    footerActionText: { color: "var(--stone)" },
    footerActionLink: {
      color: "var(--gold)",
      "&:hover": { color: "var(--champagne)" },
    },
    identityPreviewEditButton: { color: "var(--gold)" },
    dividerLine: { background: "var(--line)" },
  },
};
