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

  // Predictions below this confidence are treated as uncertain: we surface the
  // confidence bar but withhold the letter so weak guesses can't be added.
  const CONFIDENCE_THRESHOLD = 0.7;

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
      const isConfident =
        typeof result.confidence !== "number" || result.confidence >= CONFIDENCE_THRESHOLD;
      setCurrentPrediction(isConfident ? result.prediction : "-");
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

  const confidencePercent = confidence !== null ? Math.round(confidence * 100) : 0;
  const isLowConfidence = confidence !== null && confidence < CONFIDENCE_THRESHOLD;
  const lastUpdatedText = lastUpdated ? lastUpdated.toLocaleTimeString() : "Waiting for input";
  const livePreviewText = translationText || (currentPrediction !== "-" ? currentPrediction : "");
  const normalizedApiError = apiError.toLowerCase();
  const isModelWarming =
    normalizedApiError.includes("warming up") ||
    normalizedApiError.includes("backend was waking up");

  const marqueeItems = [
    "21 hand landmarks",
    "Real-time recognition",
    "Runs in your browser",
    "Confidence-aware output",
  ];

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="paper-grid" aria-hidden="true" />

      <header className="top-bar">
        <div className="top-bar-inner">
          <button className="brand" type="button" onClick={() => goTo("home")}>
            <span className="brand-sign" aria-hidden="true">S</span>
            <span className="brand-copy">
              <span className="brand-mark">SignTranslate</span>
              <span className="brand-tagline">Gesture to text</span>
            </span>
          </button>

          <nav id="primary-navigation" aria-label="Primary navigation" className={`top-nav ${menuOpen ? "top-nav-open" : ""}`}>
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
              Open studio <span aria-hidden="true">↗</span>
            </button>
          </nav>

          <button
            className={`menu-toggle ${menuOpen ? "menu-toggle-open" : ""}`}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="page-content" id="main-content">
        {currentView === "home" ? (
          <section className="landing">
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow"><span aria-hidden="true">●</span> Live gesture recognition</p>
                <h1 className="hero-title">
                  Your hands have <span className="accent-underline">something to say.</span>
                </h1>
                <p className="hero-subtitle">
                  Turn signed letters into readable text with a webcam, 21 tracked hand points,
                  and confidence-aware predictions—all from your browser.
                </p>

                <div className="hero-actions">
                  <button className="cta-pill cta-lg" type="button" onClick={() => goTo("translator")}>
                    Start translating <span aria-hidden="true">→</span>
                  </button>
                  <a className="secondary-link" href="#how-it-works">See how it works</a>
                </div>

                <div className="hero-note">
                  <span className="privacy-mark" aria-hidden="true">◎</span>
                  <span><strong>No install.</strong> Just allow camera access and start signing.</span>
                </div>
              </div>

              <div className="gesture-visual" aria-label="Illustration of a hand being mapped into a recognized letter">
                <div className="gesture-label gesture-label-top">Hand map / 21 pts</div>
                <svg className="hand-map" viewBox="0 0 430 500" role="img" aria-label="Tracked hand landmark illustration">
                  <g className="map-lines">
                    <path d="M195 421 L165 342 L104 289 L76 238 M165 342 L143 254 L137 164 L145 77 M183 332 L190 224 L200 114 L209 42 M205 332 L237 225 L260 127 L272 61 M224 347 L278 273 L315 207 L334 142 M225 375 L302 350 L350 318 L381 282" />
                  </g>
                  <g className="map-points">
                    {[
                      [195,421],[165,342],[104,289],[76,238],[143,254],[137,164],[145,77],
                      [190,224],[200,114],[209,42],[237,225],[260,127],
                      [272,61],[224,347],[278,273],[315,207],[334,142],[225,375],[302,350],
                      [350,318],[381,282]
                    ].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r={index === 0 ? 9 : 6} />)}
                  </g>
                </svg>
                <div className="prediction-ticket">
                  <span>Recognized sign</span>
                  <strong>A</strong>
                  <div className="ticket-confidence">
                    <i />
                    <span>94% confidence</span>
                  </div>
                </div>
                <span className="gesture-cross gesture-cross-one" aria-hidden="true">+</span>
                <span className="gesture-cross gesture-cross-two" aria-hidden="true">+</span>
              </div>
            </section>

            <div className="marquee" aria-hidden="true">
              <div className="marquee-track">
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                  <span className="marquee-item" key={`${item}-${index}`}>
                    {item}
                    <span className="marquee-dot">●</span>
                  </span>
                ))}
              </div>
            </div>

            <section className="section process-section" id="how-it-works">
              <div className="section-head">
                <p className="eyebrow">From gesture to language</p>
                <h2>Four small steps.<br />One clear message.</h2>
                <p className="section-lead">
                  Each frame becomes a normalized map of your hand, then a lightweight model
                  identifies the letter while you stay in control of the sentence.
                </p>
              </div>

              <div className="feature-grid">
                <article className="feature-card">
                  <span className="feature-number" aria-hidden="true">01</span>
                  <span className="feature-icon" aria-hidden="true">⌁</span>
                  <h3>Show a sign</h3>
                  <p>Your webcam captures a single hand—no special sensor or wearable needed.</p>
                </article>
                <article className="feature-card">
                  <span className="feature-number" aria-hidden="true">02</span>
                  <span className="feature-icon" aria-hidden="true">∷</span>
                  <h3>Map the hand</h3>
                  <p>MediaPipe follows 21 points and converts them into 63 stable coordinates.</p>
                </article>
                <article className="feature-card">
                  <span className="feature-number" aria-hidden="true">03</span>
                  <span className="feature-icon" aria-hidden="true">⌇</span>
                  <h3>Recognize the letter</h3>
                  <p>The model returns its best match and a confidence score in near real time.</p>
                </article>
                <article className="feature-card">
                  <span className="feature-number" aria-hidden="true">04</span>
                  <span className="feature-icon" aria-hidden="true">Aa</span>
                  <h3>Build your message</h3>
                  <p>Add letters, spaces, or corrections until the sentence says exactly what you mean.</p>
                </article>
              </div>
            </section>

            <section className="section">
              <div className="about-card">
                <div className="about-monogram" aria-hidden="true">
                  <span>KB</span>
                  <small>Builder / Engineer</small>
                </div>
                <div className="about-copy">
                  <p className="eyebrow">Built with purpose</p>
                  <h2>Technology should make communication feel easier.</h2>
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
                <div className="logo-strip" aria-label="Technology used">
                  {["React", "MediaPipe", "Flask", "TensorFlow", "Vercel", "Render"].map((tech) => (
                    <span className="logo-chip" key={tech}>{tech}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="cta-band">
              <p className="eyebrow">Ready when you are</p>
              <h2>Make your first sign.</h2>
              <p>Open the studio, center your hand, and see your gesture become text.</p>
              <button className="cta-pill cta-lg" type="button" onClick={() => goTo("translator")}>
                Open the translator <span aria-hidden="true">→</span>
              </button>
            </section>
          </section>
        ) : (
          <section className="translator">
            <header className="translator-head">
              <div>
                <p className="eyebrow">Translation studio</p>
                <h1>Sign clearly. Build your message.</h1>
                <p className="translator-intro">Keep one hand in frame, then add each confident letter to your sentence.</p>
              </div>
              <span className="status-badge">
                <span className="status-dot" aria-hidden="true" />
                Tracking Active
              </span>
            </header>

            <div className="main-content">
              <section className="panel camera-box">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Input 01</span>
                    <h2>Camera</h2>
                  </div>
                  <span className="live-chip"><i aria-hidden="true" /> Live</span>
                </div>
                <div className="camera-frame">
                  <HandTracking onTranslationUpdate={handleTranslationUpdate} />
                  <span className="frame-corner frame-corner-tl" aria-hidden="true" />
                  <span className="frame-corner frame-corner-tr" aria-hidden="true" />
                  <span className="frame-corner frame-corner-bl" aria-hidden="true" />
                  <span className="frame-corner frame-corner-br" aria-hidden="true" />
                  <span className="camera-guide">Keep your hand inside the frame</span>
                </div>
              </section>

              <section className="panel translation-box">
                <div className="panel-title-row">
                  <div>
                    <span className="panel-kicker">Output 02</span>
                    <h2>Your message</h2>
                  </div>
                  <button className="ghost-pill ghost-sm" type="button" onClick={clearTranslation}>
                    Reset
                  </button>
                </div>

                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Current sign</span>
                    <strong className="metric-value-lg">{currentPrediction}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Confidence</span>
                    <strong>{confidence !== null ? `${confidencePercent}%` : "--"}</strong>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Last update</span>
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

                {isLowConfidence && !isModelWarming && !apiError ? (
                  <p className="low-confidence-text">
                    Low confidence — hold the sign steady and keep your hand centered for a clearer read.
                  </p>
                ) : null}

                <label className="sr-only" htmlFor="translation-output">Translated message</label>
                <textarea
                  id="translation-output"
                  className="translation-text"
                  value={livePreviewText}
                  readOnly
                  aria-live="polite"
                  placeholder="Build your translated sentence here..."
                />

                <div className="action-row">
                  <button className="cta-pill" type="button" onClick={appendCurrentSign} disabled={!currentPrediction || currentPrediction === "-"}>
                    Add sign <span aria-hidden="true">+</span>
                  </button>
                  <button className="ghost-pill" type="button" onClick={appendSpace}>
                    Add space
                  </button>
                  <button className="ghost-pill" type="button" onClick={removeLastCharacter}>
                    Delete last
                  </button>
                </div>
              </section>
            </div>

            <section className="translator-extras">
              <article className="panel info-card">
                <span className="panel-kicker">For a clearer read</span>
                <h3>Set up your space</h3>
                <ul>
                  <li>Keep your hand centered in the frame for best confidence.</li>
                  <li>Pause briefly between letters before pressing Add Sign.</li>
                  <li>Use even lighting and avoid backlighting when possible.</li>
                </ul>
              </article>
              <article className="panel info-card">
                <span className="panel-kicker">Behind the build</span>
                <h3>Explore the project</h3>
                <p>See more accessibility and AI work by Khalifeh.</p>
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
            <span className="brand-sign" aria-hidden="true">S</span>
            <span className="brand-mark">SignTranslate</span>
          </div>
          <span className="footer-tech">Made with MediaPipe, TensorFlow, React & Flask</span>
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
