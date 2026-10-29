// FAKE login helpers used by pages/Login.tsx.
// Replace these with Clerk calls later. Keep the same names and signatures
// so Login.tsx doesn't need to change.

const UB_EMAIL_DOMAIN = "@buffalo.edu";
const FAKE_SEND_DELAY_MS = 1500;

/** True if the email is a UB address, e.g. "jlee42@buffalo.edu". */
export function isUbEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith(UB_EMAIL_DOMAIN) &&
    normalized.length > UB_EMAIL_DOMAIN.length
  );
}

/** FAKE: pretends to email a 6-digit code. Waits 1.5s, then resolves. */
export function sendLoginCode(email: string): Promise<void> {
  void email; // TODO(Clerk): send the code to this address.
  return new Promise((resolve) => setTimeout(resolve, FAKE_SEND_DELAY_MS));
}

/** FAKE: does nothing yet. Clerk will check the 6-digit code here. */
export async function verifyLoginCode(
  email: string,
  code: string,
): Promise<void> {
  void email;
  void code; // TODO(Clerk): verify the code and sign the user in.
}
