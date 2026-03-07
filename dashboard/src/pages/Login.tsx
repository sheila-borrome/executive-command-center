import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = isSignUp ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-800 px-4">
      <div className="w-full max-w-sm">
        {/* Gradient accent bar */}
        <div className="mb-6 h-1 w-full rounded-full" style={{ background: "linear-gradient(90deg, #f97316, #ec4899, #facc15)" }} />
        <div className="rounded-xl border border-gray-700 bg-surface-900 p-6 shadow-2xl" style={{ borderTopColor: "rgba(249,115,22,0.3)" }}>
          <h2
            className="mb-1 text-2xl uppercase tracking-wide"
            style={{ fontFamily: "'Lilita One', system-ui, sans-serif", background: "linear-gradient(90deg, #f97316, #ec4899, #facc15)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Executive Command Center
          </h2>
          <p className="mb-6 text-sm text-gray-500">{isSignUp ? "Create your account" : "Sign in to your account"}</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-lg border border-gray-600 bg-surface-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-lg border border-gray-600 bg-surface-800 px-3 py-2.5 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(90deg, #f97316, #ec4899)" }}
            >
              {loading ? (isSignUp ? "Creating account…" : "Signing in…") : isSignUp ? "Sign up" : "Sign in"}
            </button>
            <p className="pt-1 text-center text-sm text-gray-500">
              {isSignUp ? "Already have an account?" : "No account?"}{" "}
              <button type="button" onClick={() => setIsSignUp((v) => !v)} className="text-orange-400 hover:text-pink-400 hover:underline transition-colors">
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
