import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { DateDisplay } from "./DateDisplay";
import { SearchBar } from "./SearchBar";
import { apiGet } from "../lib/api";
import type { Notification } from "../types";

const TABS = [
  { path: "/", label: "Command Center" },
  { path: "/projects", label: "Projects" },
  { path: "/tasks", label: "Tasks" },
  { path: "/outreach", label: "Outreach" },
  { path: "/meetings", label: "Meetings" },
  { path: "/calendar", label: "Calendar" },
  { path: "/team", label: "Team" },
  { path: "/settings", label: "Settings" },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    apiGet<{ notifications: Notification[] }>("/notifications").then((r) => setNotifications(r.notifications)).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-surface-800">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-orange-500/20 bg-surface-900 px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="md:hidden rounded p-2 text-gray-400 hover:bg-surface-700 hover:text-orange-400"
            onClick={() => setNavOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1
            className="whitespace-nowrap text-2xl uppercase tracking-wide"
            style={{
              fontFamily: "'Lilita One', system-ui, sans-serif",
              background: "linear-gradient(90deg, #f97316, #ec4899, #facc15)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Executive Command Center
          </h1>
          <DateDisplay />
        </div>
        <div className="flex items-center gap-2">
          <SearchBar className="hidden sm:flex" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative rounded-lg border border-gray-700 bg-surface-800 p-2 text-gray-400 hover:border-orange-500/40 hover:text-orange-400"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-80 max-h-[70vh] overflow-auto rounded-lg border border-gray-600 bg-surface-800 py-1 shadow-xl">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-2 hover:bg-surface-700 ${!n.read ? "bg-orange-500/8 border-l-2 border-l-orange-500/50" : ""}`}
                      >
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-500">{n.body}</p>}
                        {n.link && (
                          <button
                            type="button"
                            onClick={() => { navigate(n.link!); setNotifOpen(false); }}
                            className="mt-1 text-xs text-blue-400 hover:underline"
                          >
                            View
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-gray-700 bg-surface-800 px-3 py-2 text-sm text-gray-300 hover:border-orange-500/40 hover:text-orange-300"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="truncate max-w-[120px]">{user?.email ?? "Account"}</span>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-600 bg-surface-800 py-1 shadow-xl">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-surface-700"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <nav
        className={`shrink-0 border-b border-orange-500/10 bg-surface-900 transition-all md:block ${
          navOpen ? "block" : "hidden"
        }`}
      >
        <div className="flex flex-wrap gap-1 overflow-x-auto px-4 py-2 md:flex-nowrap">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/"}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/50"
                    : "text-gray-400 hover:bg-surface-700 hover:text-orange-300 border border-transparent"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
