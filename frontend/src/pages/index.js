import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>UPUP - AI Business Platform</title>
        <meta name="description" content="AI-powered business platform for SMBs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          Welcome to <span className="highlight">UPUP</span>
        </h1>

        <p className="description">
          The comprehensive AI-powered business platform
        </p>

        <div className="grid">
          <div className="card">
            <h2>Create &rarr;</h2>
            <p>Produce on-brand content at scale across all channels</p>
          </div>

          <div className="card">
            <h2>Communicate &rarr;</h2>
            <p>Handle all customer and prospect interactions with perfect brand voice</p>
          </div>

          <div className="card">
            <h2>Understand &rarr;</h2>
            <p>Transform data into clear insights and strategic direction</p>
          </div>

          <div className="card">
            <h2>Grow &rarr;</h2>
            <p>Discover and validate new opportunities for business expansion</p>
          </div>

          <div className="card">
            <h2>Operate &rarr;</h2>
            <p>Handle essential business operations without specialized expertise</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by AI</p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f5f5f5;
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }

        .highlight {
          color: #0070f3;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
          text-align: center;
        }

        .grid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          max-width: 800px;
          margin-top: 3rem;
        }

        .card {
          margin: 1rem;
          flex-basis: 45%;
          padding: 1.5rem;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
          background-color: white;
        }

        .card:hover,
        .card:focus,
        .card:active {
          color: #0070f3;
          border-color: #0070f3;
        }

        .card h2 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}