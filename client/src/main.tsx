import { ClerkProvider } from '@clerk/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import CurrentUserProvider from './components/CurrentUserProvider.tsx'

// Publishable keys are safe to ship to the browser. The secret key is not,
// and lives only in server/.env.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in client/.env')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <CurrentUserProvider>
        <App />
      </CurrentUserProvider>
    </ClerkProvider>
  </StrictMode>,
)
