// Styles Clerk's prebuilt components (<SignIn />, <SignUp />, ...) to match
// our brand. Passed once to ClerkProvider in main.tsx.
// Docs: https://clerk.com/docs/react-router/guides/customizing-clerk/appearance-prop/overview
// Keep these values in sync with the tokens at the top of index.css.
const SANS =
  '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const clerkAppearance = {
  variables: {
    colorPrimary: "#C5A059", // gold: only the main button uses it
    colorPrimaryForeground: "#121212", // dark text on gold is easier to read
    colorForeground: "#121212",
    colorMutedForeground: "#4A4A4A",
    colorNeutral: "#121212",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#121212",
    fontFamily: SANS,
    fontFamilyButtons: SANS,
    // Clerk's default text is 13px; keep everything at 14px or larger.
    fontSize: {
      xs: "0.875rem",
      sm: "0.875rem",
      md: "0.9375rem",
      lg: "1.0625rem",
      xl: "1.25rem",
    },
    borderRadius: "0.5rem",
  },
  elements: {
    // Fill the column on phones, cap the width on larger screens.
    rootBox: { width: "100%" },
    cardBox: {
      width: "100%",
      maxWidth: "25rem",
      boxShadow: "none",
      border: "1px solid #E4DFD6",
    },
    formButtonPrimary: { fontWeight: 600 },
  },
};
