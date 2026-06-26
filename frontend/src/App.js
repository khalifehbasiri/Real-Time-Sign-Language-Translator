import React, { useState } from 'react';
import './App.css';
import HandTracking from './components/HandTracking';

function App() {
  const [currentView, setCurrentView] = useState("translator");
  const [currentPrediction, setCurrentPrediction] = useState("-");
  const [confidence, setConfidence] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [translationText, setTranslationText] = useState("");

  const handleTranslationUpdate = (result) => {
    if (!result) return;

    if (typeof result === "string") {
      setCurrentPrediction(result);
      setLastUpdated(new Date());
      return;
    }

    if (result.prediction) {
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
  };

  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;
  const lastUpdatedText = lastUpdated ? lastUpdated.toLocaleTimeString() : "Waiting for input";

  return (
    <div className="App">
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="brand-group">
            <span className="brand-mark">SignTranslate AI</span>
            <a
              className="portfolio-link"
              href="https://kbasiri.com"
              target="_blank"
              rel="noreferrer"
            >
              kbasiri.com
            </a>
          </div>
          <nav className="top-nav">
            <button
              className={`nav-btn ${currentView === "translator" ? "nav-btn-active" : ""}`}
              type="button"
              onClick={() => setCurrentView("translator")}
            >
              Translator
            </button>
            <button
              className={`nav-btn ${currentView === "home" ? "nav-btn-active" : ""}`}
              type="button"
              onClick={() => setCurrentView("home")}
            >
              Home
            </button>
          </nav>
        </div>
      </header>

      <main className="page-content">
        {currentView === "home" ? (
          <section className="landing">
            <section className="hero panel">
              <p className="app-eyebrow">Inclusive Communication Platform</p>
              <h1>Translate ASL in real time with confidence-aware AI</h1>
              <p className="app-subtitle">
                Built with MediaPipe landmarks and TensorFlow inference to convert hand signs
                into readable text instantly.
              </p>
              <div className="hero-actions">
                <button className="primary-btn" type="button" onClick={() => setCurrentView("translator")}>
                  Go to Translator
                </button>
                <span className="muted-note">Webcam access required</span>
              </div>
            </section>

            <section className="feature-grid">
              <article className="panel feature-card">
                <h3>Low Latency</h3>
                <p>Optimized 63-point landmark inference for smooth real-time prediction.</p>
              </article>
              <article className="panel feature-card">
                <h3>Confidence Scoring</h3>
                <p>Each prediction includes confidence so users can trust the output quality.</p>
              </article>
              <article className="panel feature-card">
                <h3>Production-Ready Stack</h3>
                <p>React frontend, Flask API, TensorFlow model, Docker-ready backend workflow.</p>
              </article>
            </section>

            <section className="home-grid">
              <article className="panel info-card">
                <h3>How It Works</h3>
                <ol>
                  <li>MediaPipe extracts 21 hand landmarks from each frame.</li>
                  <li>Flask API sends landmarks into the trained TensorFlow model.</li>
                  <li>Predicted letters are assembled into sentence output live.</li>
                </ol>
              </article>
              <article className="panel info-card">
                <h3>Tech Stack</h3>
                <div className="stack-list">
                  <span>React</span>
                  <span>MediaPipe</span>
                  <span>TensorFlow</span>
                  <span>Flask</span>
                  <span>Docker</span>
                  <span>AWS EC2</span>
                </div>
              </article>
              <article className="panel info-card">
                <h3>Built By</h3>
                <p>
                  Khalifeh Basiri - software engineer focused on practical AI products and
                  human-centered interfaces.
                </p>
                <a href="https://kbasiri.com" target="_blank" rel="noreferrer">
                  Visit kbasiri.com
                </a>
              </article>
            </section>
          </section>
        ) : (
          <>
            <header className="app-header app-header-live">
              <div>
                <p className="app-eyebrow">Live Session</p>
                <h1>Sign Language Translator</h1>
              </div>
            </header>

            <div className="main-content">
              <section className="panel camera-box">
                <div className="panel-title-row">
                  <h2>Live Camera Feed</h2>
                  <span className="status-badge">Tracking Active</span>
                </div>
                <HandTracking onTranslationUpdate={handleTranslationUpdate} />
              </section>

              <section className="panel translation-box">
                <div className="panel-title-row">
                  <h2>Translation Console</h2>
                  <button className="clear-btn" type="button" onClick={clearTranslation}>
                    Reset
                  </button>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Current Sign</span>
                    <strong>{currentPrediction}</strong>
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

                <div className="confidence-track" aria-hidden="true">
                  <span className="confidence-fill" style={{ width: `${confidencePercent}%` }} />
                </div>

                <textarea
                  className="translation-text"
                  value={translationText}
                  readOnly
                  placeholder="Build your translated sentence here..."
                />

                <div className="action-row">
                  <button className="primary-btn" type="button" onClick={appendCurrentSign}>
                    Add Sign
                  </button>
                  <button className="secondary-btn" type="button" onClick={appendSpace}>
                    Add Space
                  </button>
                  <button className="secondary-btn" type="button" onClick={removeLastCharacter}>
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
                <a href="https://kbasiri.com" target="_blank" rel="noreferrer">
                  https://kbasiri.com
                </a>
              </article>
            </section>
          </>
        )}
      </main>

      <footer className="bottom-bar">
        <div className="bottom-bar-inner">
          <span>Real-Time Sign Language Translator</span>
          <span className="footer-links">
            <span>MediaPipe + TensorFlow + React + Flask</span>
            <a href="https://kbasiri.com" target="_blank" rel="noreferrer">
              kbasiri.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
