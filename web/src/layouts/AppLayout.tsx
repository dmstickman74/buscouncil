import { useState } from "react";
import { Outlet, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui";

export function AppLayout() {
  const { identity, loading, logout, can } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!identity) return <Navigate to="/login" replace />;

  const isAdmin = can("admin.full");
  const councilId = identity.council_id;

  function navClass(path: string) {
    return location.pathname.startsWith(path) ? "active" : "";
  }

  return (
    <div className="min-h-screen">
      <header className="header">
        <Link to="/" className="header-logo">
          <img src="/assets/asla-full-white.png" alt="ASLA" />
          <span className="divider" />
          <span className="portal-name">Business Council</span>
        </Link>

        <nav className="header-nav">
          {councilId && (
            <>
              <Link to="/forum" className={navClass("/forum")}>Discussions</Link>
              <Link to="/documents" className={navClass("/documents")}>Documents</Link>
              <Link to="/meetings" className={navClass("/meetings")}>Meetings</Link>
              <Link to="/members" className={navClass("/members")}>Members</Link>
            </>
          )}
          <Link to="/messages" className={navClass("/messages")}>Messages</Link>
        </nav>

        <div className="header-right">
          <Link to="/notifications" className="notification-bell" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM8 16a2 2 0 104 0H8z" />
            </svg>
            {identity.unread_notifications > 0 && (
              <span className="notification-badge">{identity.unread_notifications}</span>
            )}
          </Link>

          <div className="user-menu">
            <button className="user-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
              {identity.user.display_name}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            {menuOpen && (
              <div className="user-menu-dropdown" onClick={() => setMenuOpen(false)}>
                <Link to="/profile">My Profile</Link>
                <Link to="/notifications/preferences">Notification Settings</Link>
                {isAdmin && <Link to="/admin">Admin</Link>}
                <button onClick={() => { logout(); navigate("/login"); }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}
