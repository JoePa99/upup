import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children, title = 'UPUP - AI Business Platform' }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="layout">
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <header className="header">
        <div className="logo">
          <Link href="/">
            <a className="logo-link">UPUP</a>
          </Link>
        </div>

        <nav className="nav">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <a className="nav-link">Dashboard</a>
              </Link>
              
              {user?.isSuperAdmin ? (
                <Link href="/admin">
                  <a className="nav-link">Admin</a>
                </Link>
              ) : (
                <>
                  <Link href="/create">
                    <a className="nav-link">Create</a>
                  </Link>
                  <Link href="/communicate">
                    <a className="nav-link">Communicate</a>
                  </Link>
                  <Link href="/understand">
                    <a className="nav-link">Understand</a>
                  </Link>
                  <Link href="/grow">
                    <a className="nav-link">Grow</a>
                  </Link>
                  <Link href="/operate">
                    <a className="nav-link">Operate</a>
                  </Link>
                </>
              )}
              
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <a className="nav-link">Login</a>
              </Link>
              <Link href="/register">
                <a className="nav-link cta">Get Started</a>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="main">{children}</main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} UPUP - AI Business Platform</p>
      </footer>

      <style jsx>{`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .logo-link {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0070f3;
          text-decoration: none;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-link {
          color: #333;
          text-decoration: none;
          font-weight: 500;
        }

        .nav-link:hover {
          color: #0070f3;
        }

        .nav-link.cta {
          background-color: #0070f3;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }

        .nav-link.cta:hover {
          background-color: #0051a2;
        }

        .logout-button {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          font-size: 1rem;
          padding: 0;
        }

        .logout-button:hover {
          color: #0070f3;
        }

        .main {
          flex: 1;
          padding: 2rem;
        }

        .footer {
          padding: 1.5rem;
          background-color: #f7f7f7;
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default Layout;