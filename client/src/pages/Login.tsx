import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react";
import { isUbEmail, sendLoginCode, verifyLoginCode } from "../auth/fakeAuth";
import "../styles/theme.css";
import "./Login.css";

const CODE_LENGTH = 6;
const NON_UB_EMAIL_ERROR =
  "Campus Glam is for UB students. Please use your @buffalo.edu email.";

type Step = "email" | "code";

// One page, four states (see designs/login.html):
//   01 enter email      -> step "email"
//   02 non-UB error     -> step "email" + error
//   03 sending code     -> step "email" + loading
//   04 enter 6-digit    -> step "code"
export default function Login() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);

  // Put the cursor in the first code box when state 04 appears.
  useEffect(() => {
    if (step === "code") codeInputs.current[0]?.focus();
  }, [step]);

  async function handleContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    if (!isUbEmail(email)) {
      setError(NON_UB_EMAIL_ERROR);
      return;
    }

    setError(null);
    setLoading(true);
    await sendLoginCode(email.trim());
    setLoading(false);
    setStep("code");
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await verifyLoginCode(email.trim(), code.join(""));
  }

  async function handleResend() {
    setCode(Array(CODE_LENGTH).fill(""));
    codeInputs.current[0]?.focus();
    await sendLoginCode(email.trim());
  }

  function focusBox(index: number) {
    codeInputs.current[Math.max(0, Math.min(index, CODE_LENGTH - 1))]?.focus();
  }

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => prev.map((d, i) => (i === index ? digit : d)));
    if (digit) focusBox(index + 1);
  }

  function handleCodeKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index]) focusBox(index - 1);
    else if (e.key === "ArrowLeft") focusBox(index - 1);
    else if (e.key === "ArrowRight") focusBox(index + 1);
  }

  // Pasting "123456" into any box fills all six.
  function handleCodePaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    e.preventDefault();
    const pasted = digits.slice(0, CODE_LENGTH).split("");
    setCode(Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? ""));
    focusBox(pasted.length);
  }

  return (
    <main className="login-screen">
      <div className="stack">
        {step === "email" ? (
          <>
            <div className="intro">
              <h1 className="title">
                Welcome to <em>Campus Glam</em>
              </h1>
              <p className="subtitle">
                Book lashes, hair and nails from UB students.
              </p>
            </div>
            <hr className="divider" />
            <form className="form" onSubmit={handleContinue} noValidate>
              <div className="field">
                <label className="label" htmlFor="login-email">
                  Email
                </label>
                <input
                  className={error ? "input input--error" : "input"}
                  id="login-email"
                  type="email"
                  placeholder="yourname@buffalo.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  readOnly={loading}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-email-error" : undefined}
                />
                {error ? (
                  <p className="error" id="login-email-error" role="alert">
                    <span className="error-icon" aria-hidden="true">
                      !
                    </span>
                    <span>{error}</span>
                  </p>
                ) : (
                  <p className="helper">Use your @buffalo.edu email.</p>
                )}
              </div>
              {loading ? (
                <button
                  className="btn btn--loading"
                  type="submit"
                  disabled
                  aria-busy="true"
                >
                  <span className="spinner" aria-hidden="true" />
                  <span>Sending code…</span>
                </button>
              ) : (
                <button className="btn" type="submit">
                  Continue
                </button>
              )}
            </form>
          </>
        ) : (
          <>
            <div className="intro">
              <h1 className="title title--code">Check your email</h1>
              <p className="subtitle">
                We sent a 6-digit code to your email
                <br />
                <strong>{email.trim()}</strong>
              </p>
            </div>
            <hr className="divider" />
            <form className="form" onSubmit={handleVerify}>
              <div className="code-group">
                <div className="code" role="group" aria-label="6-digit code">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        codeInputs.current[i] = el;
                      }}
                      inputMode="numeric"
                      maxLength={2}
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      aria-label={`Digit ${i + 1}`}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      onPaste={handleCodePaste}
                      onFocus={(e) => e.target.select()}
                    />
                  ))}
                </div>
                <p className="resend">
                  Didn’t get it?{" "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      void handleResend();
                    }}
                  >
                    Resend code
                  </a>
                </p>
              </div>
              <button className="btn" type="submit">
                Verify
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
