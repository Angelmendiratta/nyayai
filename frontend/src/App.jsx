import { useState, useCallback } from "react";
import UploadStep from "./components/UploadStep";
import ConfigStep from "./components/ConfigStep";
import ResultsStep from "./components/ResultsStep";
import MultiResults from "./components/MultiResults";

const API_BASE = "https://nyayai-0o6j.onrender.com";

const INDIA_ATTRS = ["caste", "religion", "state", "region", "language", "rural_urban", "gender", "age_group", "tribe", "district"];
const OUTCOME_NAMES = ["approved", "selected", "eligible", "status", "outcome", "result", "label"];

export default function App() {
  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState("");
  const [columns, setColumns] = useState([]);
  const [preview, setPreview] = useState([]);
  const [config, setConfig] = useState({ outcomeCol: "", sensitiveCol: "", positiveOutcome: "1", language: "English" });
  const [results, setResults] = useState(null);
  const [multiResults, setMultiResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState("csv");

  const handleCSVLoaded = useCallback((csv, cols, prev) => {
    setCsvData(csv);
    setColumns(cols);
    setPreview(prev);
    setError("");
    const autoOutcome = cols.find(c => OUTCOME_NAMES.includes(c.toLowerCase())) || "";
    const autoSensitive = cols.find(c => INDIA_ATTRS.includes(c.toLowerCase())) || "";
    setConfig(c => ({
      ...c,
      outcomeCol: autoOutcome || c.outcomeCol,
      sensitiveCol: autoSensitive || c.sensitiveCol,
    }));
    setStep(2);
  }, []);

  const handleAnalyze = async () => {
    setLoading("single");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_data: inputMode === "csv" ? csvData : null,
          predictions: inputMode === "paste" ? (() => { try { return JSON.parse(csvData); } catch { return null; } })() : null,
          outcome_col: config.outcomeCol,
          sensitive_col: config.sensitiveCol,
          positive_outcome: config.positiveOutcome,
          language: config.language,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Analysis failed"); }
      setResults(await res.json());
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAll = async () => {
    setLoading("all");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/analyze-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_data: csvData,
          outcome_col: config.outcomeCol,
          positive_outcome: config.positiveOutcome,
          language: config.language,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail) || "Full audit failed"); }
      setMultiResults(await res.json());
      setStep(4);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = async () => {
    setSampleLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/sample-data`);
      const data = await res.json();
      const lines = data.csv.trim().split("\n");
      const headers = lines[0].split(",");
      const rows = lines.slice(1).map(l => {
        const v = l.split(",");
        return Object.fromEntries(headers.map((h, i) => [h, v[i]]));
      });
      setCsvData(data.csv);
      setColumns(headers);
      setPreview(rows.slice(0, 3));
      setConfig(c => ({ ...c, outcomeCol: "approved", sensitiveCol: "caste" }));
      setInputMode("csv");
      setStep(2);
    } catch {
      setError("Backend not running. Start it first on port 8000.");
    } finally {
      setSampleLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setCsvData("");
    setColumns([]);
    setPreview([]);
    setResults(null);
    setMultiResults(null);
    setError("");
    setLoading(false);
    setConfig({ outcomeCol: "", sensitiveCol: "", positiveOutcome: "1", language: "English" });
  };

  const steps = ["Upload Data", "Configure", "Results"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,14,26,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border)", padding: "0 2rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px rgba(79,142,247,0.4)" }}>⚖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px", background: "linear-gradient(90deg, var(--accent), var(--accent3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NyayAI</div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: -2 }}>AI Bias Auditor for India</div>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: step === i + 1 ? 1 : step > i + 1 ? 0.7 : 0.3 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, background: step > i + 1 ? "var(--accent3)" : step === i + 1 ? "var(--accent)" : "var(--card2)", color: step >= i + 1 ? "#fff" : "var(--text3)", border: `1px solid ${step === i + 1 ? "var(--accent)" : "var(--border)"}` }}>
                    {step > i + 1 ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? "var(--text)" : "var(--text3)" }}>{s}</span>
                </div>
                {i < 2 && <div style={{ width: 20, height: 1, background: "var(--border2)" }} />}
              </div>
            ))}
          </div>

          {step > 1 && (
            <button onClick={reset} style={{ fontSize: 12, color: "var(--text3)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px" }}>
              ↺ Reset
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {error && (
          <div className="fade-up" style={{ background: "rgba(247,85,85,0.1)", border: "1px solid rgba(247,85,85,0.3)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: "1.5rem", color: "#fca5a5", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠</span> {error}
          </div>
        )}

        {step === 1 && (
          <UploadStep
            onCSVLoaded={handleCSVLoaded}
            onLoadSample={loadSample}
            sampleLoading={sampleLoading}
            inputMode={inputMode}
            setInputMode={setInputMode}
            csvData={csvData}
            setCsvData={setCsvData}
          />
        )}

        {step === 2 && (
          <ConfigStep
            columns={columns}
            preview={preview}
            config={config}
            setConfig={setConfig}
            onAnalyze={handleAnalyze}
            onAnalyzeAll={handleAnalyzeAll}
            loading={loading}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && results && (
          <ResultsStep
            results={results}
            config={config}
            onReset={reset}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && multiResults && (
          <MultiResults
            data={multiResults}
            config={config}
            onReset={reset}
            onBack={() => setStep(2)}
          />
        )}
      </main>
    </div>
  );
}