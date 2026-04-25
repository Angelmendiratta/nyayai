import Papa from "papaparse";
import { useRef, useState } from "react";

const ATTRS = ["caste", "religion", "state", "region", "language", "rural_urban", "gender", "age_group", "tribe", "district"];

export default function UploadStep({ onCSVLoaded, onLoadSample, sampleLoading, inputMode, setInputMode, csvData, setCsvData }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);
  const [jsonError, setJsonError] = useState("");
  const [rowCount, setRowCount] = useState(null);

  const processCSV = (csv) => {
  const result = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (result.errors.length && result.data.length === 0) {
    setJsonError("Could not parse CSV. Make sure it has a header row.");
    return;
  }
  const headers = result.meta.fields;
  const rows = result.data;
  setRowCount(rows.length);
  // Convert back to CSV string for backend
  onCSVLoaded(csv, headers, rows.slice(0, 3));
};

  const handleFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => processCSV(e.target.result);
    r.readAsText(file);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handlePaste = () => {
    setJsonError("");
    try {
      const d = JSON.parse(csvData);
      if (!Array.isArray(d) || !d.length) throw new Error("Must be a non-empty array");
      const cols = Object.keys(d[0]);
      setRowCount(d.length);
      onCSVLoaded(csvData, cols, d.slice(0, 3));
    } catch (e) {
      setJsonError("Invalid JSON: must be an array like [{ \"col\": \"val\" }, ...]");
    }
  };

  return (
    <div>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.25)", borderRadius: 20, padding: "6px 16px", fontSize: 12, color: "var(--accent)", fontWeight: 600, marginBottom: 20, letterSpacing: "0.05em" }}>
          ✦ INDIA'S FIRST AI BIAS AUDITOR
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 16 }}>
          Detect bias in AI decisions<br />
          <span style={{ background: "linear-gradient(90deg, var(--accent), var(--accent3))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>before they harm people</span>
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
          Upload beneficiary data from any government scheme and instantly find caste, gender, or regional bias using AI.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="fade-up-1" style={{ display: "flex", gap: 8, marginBottom: "1.5rem", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 4, maxWidth: 400 }}>
        {[["csv", "Upload CSV"], ["paste", "Paste JSON"]].map(([m, label]) => (
          <button key={m} onClick={() => setInputMode(m)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, fontSize: 13, fontWeight: 500, background: inputMode === m ? "var(--accent)" : "transparent", color: inputMode === m ? "#fff" : "var(--text2)" }}>
            {label}
          </button>
        ))}
      </div>

      {inputMode === "csv" ? (
        <div className="fade-up-2"
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          style={{ border: `2px dashed ${dragging ? "var(--accent)" : "var(--border2)"}`, borderRadius: "var(--radius2)", padding: "4rem 2rem", textAlign: "center", cursor: "pointer", background: dragging ? "rgba(79,142,247,0.05)" : "var(--card)", transition: "all 0.2s", marginBottom: "1.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>📄</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Drop your CSV here or click to browse</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>Columns can include: caste, gender, approved, state, religion…</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="fade-up-2" style={{ marginBottom: "1.5rem" }}>
          <textarea value={csvData} onChange={e => { setCsvData(e.target.value); setJsonError(""); }}
            placeholder={`[\n  {"gender": "Female", "caste": "SC", "approved": 0},\n  {"gender": "Male", "caste": "General", "approved": 1}\n]`}
            style={{ width: "100%", height: 180, fontFamily: "var(--mono)", fontSize: 13, padding: "14px 16px", borderRadius: "var(--radius)", border: `1px solid ${jsonError ? "var(--red)" : "var(--border2)"}`, background: "var(--card)", color: "var(--text)", resize: "vertical", lineHeight: 1.6 }} />
          {jsonError && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(247,85,85,0.1)", border: "1px solid rgba(247,85,85,0.3)", borderRadius: "var(--radius)", color: "#fca5a5", fontSize: 13 }}>
              ⚠ {jsonError}
            </div>
          )}
          <button onClick={handlePaste} style={{ marginTop: 10, padding: "10px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 600, background: "var(--accent)", color: "#fff" }}>
            Parse JSON →
          </button>
        </div>
      )}

      {/* Row count badge */}
      {rowCount !== null && (
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(0,212,168,0.08)", border: "1px solid rgba(0,212,168,0.25)", borderRadius: "var(--radius)", fontSize: 13 }}>
          <span style={{ color: "var(--accent3)", fontSize: 16 }}>✓</span>
          <span style={{ color: "var(--accent3)", fontWeight: 600 }}>{rowCount.toLocaleString()} records loaded</span>
          <span style={{ color: "var(--text2)" }}>and ready for analysis</span>
        </div>
      )}

      {/* Divider */}
      <div className="fade-up-3" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 600 }}>OR TRY A DEMO</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* Sample data button */}
      <div className="fade-up-3" style={{ marginBottom: "3rem" }}>
        <button onClick={onLoadSample} disabled={sampleLoading} style={{ width: "100%", padding: "14px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 600, background: "var(--card2)", color: sampleLoading ? "var(--text3)" : "var(--text)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: sampleLoading ? "not-allowed" : "pointer" }}>
          {sampleLoading ? (
            <>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Loading sample data…
            </>
          ) : (
            <>
              <span style={{ fontSize: 18 }}>🏛</span>
              Load sample PMAY beneficiary data
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>20 records</span>
            </>
          )}
        </button>
      </div>

      {/* Attributes */}
      <div className="fade-up-4">
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.1em", marginBottom: 12 }}>INDIA-SPECIFIC SENSITIVE ATTRIBUTES DETECTED</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ATTRS.map(a => (
            <span key={a} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: "rgba(79,142,247,0.08)", color: "var(--accent)", border: "1px solid rgba(79,142,247,0.2)", fontFamily: "var(--mono)" }}>{a}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
