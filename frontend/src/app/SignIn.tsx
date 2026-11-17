import { useState } from "react";
import { api, errorMessage } from "../api/client";
import type { ApiWorkspace } from "../api/client";

export function SignIn({
  onSignIn,
}: {
  onSignIn: (workspace: ApiWorkspace) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="workspace">
      <form
        className="owner-sign-in"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          const form = event.currentTarget;
          const password = String(new FormData(form).get("password"));
          setBusy(true);
          setError("");
          try {
            await api.POST("/api/session", { body: { password } });
            const { data } = await api.GET("/api/workspace");
            if (!data) throw new Error("Missing workspace");
            form.reset();
            onSignIn(data);
          } catch (failure) {
            setError(errorMessage(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>Sign in to Patterna</h1>
        <label>
          Owner password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            maxLength={256}
          />
        </label>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
        <button className="button button-primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
