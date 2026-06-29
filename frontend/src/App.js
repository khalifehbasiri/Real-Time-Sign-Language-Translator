import React, { useState } from 'react';
import './App.css';
import HandTracking from './components/HandTracking';

function App() {
  const [currentView, setCurrentView] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState("-");
  const [confidence, setConfidence] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [translationText, setTranslationText] = useState("");
  const [apiError, setApiError] = useState("");

  const handleTranslationUpdate = (result) => {
    if (!result) return;

    if (typeof result === "string") {
      setApiError("");
      setCurrentPrediction(result);
      setLastUpdated(new Date());
      return;
    }

    if (result.error) {
      setApiError(result.error);
      return;
    }

    if (result.prediction) {
      setApiError("");
      setCurrentPrediction(result.prediction);
      setLastUpdated(new Date());
    }

    if (typeof result.confidence === "number") {
      setConfidence(result.confidence);
    }
  };

  const appendCurrentSign = () => {
    if (!currentPrediction || currentPrediction === "-") return;
    setTranslationText((prev) => `${prev}${currentPrediction}`);
  };

  const appendSpace = () => {
    setTranslationText((prev) => `${prev} `);
  };

  const removeLastCharacter = () => {
    setTranslationText((prev) => prev.slice(0, -1));
  };

  const clearTranslation = () => {
    setTranslationText("");
    setCurrentPrediction("-");
    setConfidence(null);
    setLastUpdated(null);
    setApiError("");
  };

  const goTo = (view) => {
    setCurrentView(view);
    setMenuOpen(false);
  };

  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;
  const lastUpdatedText = lastUpdated ? lastUpdated.toLocaleTimeString() : "Waiting for input";
  const livePreviewText = translationText || (currentPrediction !== "-" ? currentPrediction : "");
  const normalizedApiError = apiError.toLowerCase();
  const isModelWarming =
    normalizedApiError.includes("warming up") ||
    normalizedApiError.includes("backend was waking up");

  const marqueeItems = [
    "Accessibility First",
    "Real-Time Inference",
    "MediaPipe Hands",
    "TensorFlow",
    "63 Landmark Features",
    "Browser Based",
    "Privacy Friendly",
  ];

  return (
    <div className="app">
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />

      <header className="top-bar">
        <div className="top-bar-inner">
          <button className="brand" type="button" onClick={() => goTo("home")}>
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-mark">SignTranslate<span className="brand-accent">AI</span></span>
          </button>

          <nav className={`top-nav ${menuOpen ? "top-nav-open" : ""}`}>
            <button
              className={`nav-link ${currentView === "home" ? "nav-link-active" : ""}`}
              type="button"
              onClick={() => goTo("home")}
            >
              Home
            </button>
            <button
              className={`nav-link ${currentView === "translator" ? "nav-link-active" : ""}`}
              type="button"
              onClick={() => goTo("translator")}
            >
              Translator
            </button>
            <a
              className="nav-link"
              href="https://kbasiri.com"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
            >
              About
            </a>
            <button className="cta-pill nav-cta" type="button" onClick={() => goTo("translator")}>
              Start Translating
            </button>
          </nav>

          <button
            className={`menu-toggle ${menuOpen ? "menu-toggle-open" : ""}`}
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="page-content">
        {currentView === "home" ? (
          <section className="landing">
            <section className="hero">
              <h1 className="hero-title">
                Real-time sign language <span className="grad-text">translation</span>, right in your browser
              </h1>
              <p className="hero-subtitle">
                Capture hand signs with your webcam and convert them into readable text using
                confidence-aware AI predictions. Built on the fastest, most reliable on-device
                landmark pipeline.
              </p>

              <div className="hero-actions">
                <button className="cta-pill cta-lg" type="button" onClick={() => goTo("translator")}>
                  Get Started
                </button>
              </div>

              <div className="hero-metrics">
                <div className="metric-block">
                  <strong>&lt;0.8s</strong>
                  <span>Avg Inference</span>
                </div>
                <div className="metric-block">
                  <strong>99.9%</strong>
                  <span>Uptime Goal</span>
                </div>
                <div className="metric-block">
                  <strong>63</strong>
                  <span>Landmark Points</span>
                </div>
              </div>
            </section>

            <div className="marquee" aria-hidden="true">
              <div className="marquee-track">
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                  <span className="marquee-item" key={`${item}-${index}`}>
                    {item}
                    <span className="marquee-dot">✦</span>
                  </span>
                ))}
              </div>
            </div>

            <section className="section">
              <div className="section-head">
                <p className="eyebrow">Our Solution</p>
                <h2>How this app works under the hood</h2>
                <p className="section-lead">
                  Each frame processes 21 hand landmarks (x, y, z) and sends a normalized 63-value
                  vector to a lightweight backend for instant sign classification.
                </p>
              </div>

              <div className="feature-grid">
                <article className="feature-card">
                  <span className="feature-icon" aria-hidden="true">✋</span>
                  <h3>Landmark Capture</h3>
                  <p>MediaPipe Hands tracks one hand and emits 21 3D points each frame, fully in the browser.</p>
                </article>
                <article className="feature-card">
                  <span className="feature-icon" aria-hidden="true">⚙️</span>
                  <h3>Feature Normalization</h3>
                  <p>Landmarks are centered at the wrist and scaled by hand size for stable, lighting-tolerant inference.</p>
                </article>
                <article className="feature-card">
                  <span className="feature-icon" aria-hidden="true">⚡</span>
                  <h3>TensorFlow Inference API</h3>
                  <p>A Flask service serves a TensorFlow model to predict the sign class and confidence in milliseconds.</p>
                </article>
                <article className="feature-card">
                  <span className="feature-icon" aria-hidden="true">💬</span>
                  <h3>Live Translation UX</h3>
                  <p>Predicted letters are assembled into sentences with controls for space, backspace, and reset.</p>
                </article>
              </div>
            </section>

            <section className="section">
              <div className="about-card">
                <div className="about-copy">
                  <p className="eyebrow">About the Creator</p>
                  <h2>Human-centered AI, built for accessibility</h2>
                  <p>
                    I'm Khalifeh Basiri, a software engineer building practical AI apps focused on
                    accessibility and human-centered interfaces. This project combines MediaPipe
                    hand landmarks with a lightweight inference backend to deliver live sign
                    translation in the browser.
                  </p>
                  <a className="text-link" href="https://kbasiri.com" target="_blank" rel="noreferrer">
                    Learn more at kbasiri.com →
                  </a>
                </div>
                <div className="logo-strip">
                  {["React", "MediaPipe", "Flask", "TensorFlow", "Vercel", "Render"].map((tech) => (
                    <span className="logo-chip" key={tech}>{tech}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="cta-band">
              <h2>Effortless sign translation, at any scale</h2>
              <p>Turn hand signs into text—quickly and reliably. No installs, just your webcam.</p>
              <button className="cta-pill cta-lg" type="button" onClick={() => goTo("translator")}>
                Launch Translator
              </button>
            </section>
          </section>
        ) : (
          <section className="translator">
            <header className="translator-head">
              <div>
                <p className="eyebrow">Live Session</p>
                <h1>Sign Language Translator</h1>
              </div>
              <span className="status-badge">
                <span className="status-dot" aria-hidden="true" />
                Tracking Active
              </span>
            </header>

            <div className="main-content">
              <section className="panel camera-box">
                <div className="panel-title-row">
                  <h2>Live Camera Feed</h2>
                </div>
                <HandTracking onTranslationUpdate={handleTranslationUpdate} />
              </section>

              <section className="panel translation-box">
                <div className="panel-title-row">
                  <h2>Translation Console</h2>
                  <button className="ghost-pill ghost-sm" type="button" onClick={clearTranslation}>
                    Reset
                  </button>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Current Sign</span>
                    <strong className="metric-value-lg">{currentPrediction}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Confidence</span>
                    <strong>{confidence ? `${confidencePercent}%` : "--"}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Last Update</span>
                    <strong>{lastUpdatedText}</strong>
                  </div>
                </div>

                {isModelWarming ? (
                  <p className="api-warmup-text">
                    Model is loading on the server. First prediction may take up to a minute.
                  </p>
                ) : null}
                {apiError && !isModelWarming ? <p className="api-error-text">{apiError}</p> : null}

                <div className="confidence-track" aria-hidden="true">
                  <span className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
                </div>

                <textarea
                  className="translation-text"
                  value={livePreviewText}
                  readOnly
                  placeholder="Build your translated sentence here..."
                />

                <div className="action-row">
                  <button className="cta-pill" type="button" onClick={appendCurrentSign}>
                    Add Sign
                  </button>
                  <button className="ghost-pill" type="button" onClick={appendSpace}>
                    Add Space
                  </button>
                  <button className="ghost-pill" type="button" onClick={removeLastCharacter}>
                    Backspace
                  </button>
                </div>
              </section>
            </div>

            <section className="translator-extras">
              <article className="panel info-card">
                <h3>Session Tips</h3>
                <ul>
                  <li>Keep your hand centered in the frame for best confidence.</li>
                  <li>Pause briefly between letters before pressing Add Sign.</li>
                  <li>Use even lighting and avoid backlighting when possible.</li>
                </ul>
              </article>
              <article className="panel info-card">
                <h3>Project Links</h3>
                <p>Portfolio and project updates:</p>
                <a className="text-link" href="https://kbasiri.com" target="_blank" rel="noreferrer">
                  https://kbasiri.com →
                </a>
              </article>
            </section>
          </section>
        )}
      </main>

      <footer className="bottom-bar">
        <div className="bottom-bar-inner">
          <div className="footer-brand">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-mark">SignTranslate<span className="brand-accent">AI</span></span>
          </div>
          <span className="footer-tech">MediaPipe + TensorFlow + React + Flask</span>
          <a className="text-link" href="https://kbasiri.com" target="_blank" rel="noreferrer">
            kbasiri.com
          </a>
        </div>
        <div className="bottom-bar-base">© {new Date().getFullYear()} SignTranslate AI. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default App;
