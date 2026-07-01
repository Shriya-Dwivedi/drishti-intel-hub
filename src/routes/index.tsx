import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RadarMark } from "@/components/AppShell";
import { ShieldCheck, WifiOff, Database, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Sign in — Drishti" }, { name: "description", content: "Secure analyst sign-in for the Drishti workbench." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"analyst" | "admin">("analyst");
  const [user, setUser] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("drishti_user", data.username);
        localStorage.setItem("drishti_role", data.role);
        navigate({ to: "/dashboard" });
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Could not reach backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="h-1 tricolor-strip" aria-hidden />
      <div className="flex-1 grid lg:grid-cols-[1.1fr_1fr]">
        <aside className="relative hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12 overflow-hidden">
          <div className="absolute inset-0 radar-bg opacity-60" aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-3">
              <RadarMark className="h-10 w-10 text-accent" />
              <div>
                <div className="font-serif text-3xl">Drishti</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary-foreground/60">Analyst Workbench · v0.4</div>
              </div>
            </div>
            <p className="mt-12 font-serif text-2xl leading-snug max-w-md">
              Multilingual open-source intelligence retrieval, operated entirely on isolated infrastructure.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-primary-foreground/80 max-w-md">
              <li className="flex items-start gap-3"><WifiOff className="h-4 w-4 mt-0.5 text-accent" /> Zero external network calls during query execution.</li>
              <li className="flex items-start gap-3"><Database className="h-4 w-4 mt-0.5 text-accent" /> 12,847 documents across 22 Indian languages indexed.</li>
              <li className="flex items-start gap-3"><Lock className="h-4 w-4 mt-0.5 text-accent" /> Role-scoped access with full session auditing.</li>
            </ul>
          </div>
          <div className="relative text-[11px] text-primary-foreground/50 uppercase tracking-wider">
            Controlled environment · Restricted distribution
          </div>
        </aside>

        <div className="flex flex-col">
          <div className="flex-1 flex items-center justify-center px-6 py-12">
            <form onSubmit={handleLogin} className="w-full max-w-sm">
              <div className="lg:hidden flex items-center gap-3 mb-8">
                <RadarMark className="h-9 w-9 text-primary" />
                <div className="font-serif text-2xl text-primary">Drishti</div>
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-accent font-medium">Authorised access only</div>
              <h1 className="font-serif text-3xl text-primary mt-2">Sign in to continue</h1>
              <p className="text-sm text-muted-foreground mt-1">Sessions are recorded in the audit log.</p>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Operator ID</label>
                  <input
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="mt-1 w-full bg-card border border-input rounded-sm px-3 py-2.5 text-sm focus:border-accent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Passphrase</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full bg-card border border-input rounded-sm px-3 py-2.5 text-sm focus:border-accent outline-none"
                  />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Role</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["analyst", "admin"] as const).map((r) => (
                      <button type="button" key={r} onClick={() => setRole(r)}
                        className={`px-3 py-2 text-sm border rounded-sm capitalize ${role === r ? "border-accent bg-accent/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button type="submit" disabled={loading} className="w-full mt-2 bg-primary text-primary-foreground py-2.5 rounded-sm text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-60">
                  <ShieldCheck className="h-4 w-4" /> {loading ? "Signing in…" : "Enter workbench"}
                </button>
              </div>

              <div className="mt-6 flex items-center gap-2 text-[11px] uppercase tracking-wider text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> System nominal · Offline mode
              </div>
            </form>
          </div>
          <div className="border-t border-border px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>© Drishti Project · For evaluation use only</span>
            <Link to="/" className="inline-flex items-center gap-2 px-2.5 py-1 border border-accent/40 text-accent rounded-sm uppercase tracking-wider">
              Academic prototype — NTCC project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}