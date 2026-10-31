"use client";

import { FormEvent, useEffect, useState } from "react";

export default function AdminAccess() {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((data) => { if (active) setAuthenticated(data.authenticated === true); })
      .catch(() => { if (active) setAuthenticated(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Admin login failed");
      setAuthenticated(true);
      setSecret("");
      setOpen(false);
      setStatus("Admin session active");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Admin login failed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("Admin logout failed");
      setAuthenticated(false);
      setStatus("Admin session ended");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Admin logout failed");
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-access">
    {authenticated
      ? <button className="tab action" type="button" onClick={() => void logout()} disabled={busy}>{busy ? "…" : "Admin · Log out"}</button>
      : <button className="tab action" type="button" onClick={() => setOpen((value) => !value)}>Admin login</button>}
    {open && <form className="admin-login-popover" onSubmit={submit}>
      <label>Admin login secret<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="current-password" required /></label>
      <div className="row"><button className="button" disabled={busy || !secret}>{busy ? "Signing in…" : "Sign in"}</button><button className="button secondary" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
    </form>}
    {status && <span className="admin-access-status" role="status">{status}</span>}
  </div>;
}
