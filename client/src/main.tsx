import { ClerkProvider } from '@clerk/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import CurrentUserProvider from './components/CurrentUserProvider.tsx'

// Publishable keys are safe to ship to the browser. The secret key is not,
// and lives only in server/.env.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in client/.env')
}

// BrowserRouter must wrap ClerkProvider so Clerk can navigate with React
// Router. CurrentUserProvider goes inside both because it uses each.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/browse"
        signUpFallbackRedirectUrl="/browse"
        afterSignOutUrl="/"
      >
        <CurrentUserProvider>
          <App />
        </CurrentUserProvider>
      </ClerkProvider>
    </BrowserRouter>
  </StrictMode>,
)
