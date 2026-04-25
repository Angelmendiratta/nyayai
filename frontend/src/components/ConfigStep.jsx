const INDIA_ATTRS = ["caste", "religion", "state", "region", "language", "rural_urban", "gender", "age_group", "tribe", "district"];

export default function ConfigStep({ columns, preview, config, setConfig, onAnalyze, onAnalyzeAll, loading, onBack }) {
  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));
  const canAnalyze = config.outcomeCol && config.sensitiveCol && config.outcomeCol !== config.sensitiveCol;

  return (
    <div>
      <div className="fade-up" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 8 }}>Configure analysis</h2>
        <p style={{ color: "var(--text2)", fontSize: 15 }}>Tell NyayAI which column shows the decision outcome and which attribute to test for bias.</p>
      </div>

      {/* Data preview table */}
      <div className="fade-up-1" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius2)", overflow: "hidden", marginBottom: "2rem" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent3)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)" }}>Data preview — first 3 rows</span>
          <span style={{ marginLeft: "auto", fontSize: 12, fontFamily: "var(--mono)", color: "var(--text3)" }}>{columns.length} columns detected</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--card2)" }}>
                {columns.map(col => (
                  <th key={col} style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, color: INDIA_ATTRS.includes(col.toLowerCase()) ? "var(--accent)" : "var(--text2)", whiteSpace: "nowrap", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {col} {INDIA_ATTRS.includes(col.toLowerCase()) && <span style={{ color: "var(--accent3)" }}>★</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  {columns.map(col => (
                    <td key={col} style={{ padding: "10px 16px", color: "var(--text)", whiteSpace: "nowrap", fontFamily: "var(--mono)", fontSize: 12 }}>
                      {row[col] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "8px 20px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text3)" }}>
          ★ India-specific sensitive attributes auto-detected
        </div>
      </div>

      {/* Config grid */}
      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: "2rem" }}>
        {[
          { key: "outcomeCol", label: "Outcome column", hint: "Column showing the final decision (approved, selected, eligible)", type: "select" },
          { key: "sensitiveCol", label: "Sensitive attribute to test", hint: "Attribute to check for bias — caste, gender, religion, state…", type: "select" },
          { key: "positiveOutcome", label: "What counts as approved?", hint: 'The value that means "yes" — usually 1, Yes, or Approved', type: "input" },
          { key: "language", label: "Explanation language", hint: "Language for the Gemini AI explanation", type: "lang" },
        ].map(({ key, label, hint, type }) => (
          <div key={key}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
            {type === "select" && (
              <select value={config[key]} onChange={e => set(key, e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius)", border: `1px solid ${config[key] ? "var(--accent)" : "var(--border2)"}`, background: "var(--card)", color: config[key] ? "var(--text)" : "var(--text3)", fontSize: 14 }}>
                <option value="">Select column…</option>
                {columns.map(c => <option key={c} value={c}>{c}{INDIA_ATTRS.includes(c.toLowerCase()) ? " ★" : ""}</option>)}
              </select>
            )}
            {type === "input" && (
              <input type="text" value={config[key]} onChange={e => set(key, e.target.value)} placeholder="e.g. 1"
                style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border2)", background: "var(--card)", color: "var(--text)", fontSize: 14 }} />
            )}
            {type === "lang" && (
              <select value={config[key]} onChange={e => set(key, e.target.value)}
                style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1px solid var(--border2)", background:"var(--bg2)", color:"var(--text)", fontSize:14 }}>
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
        
              </select>
            )}
            <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6 }}>{hint}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="fade-up-3" style={{ display: "flex", gap: 12 }}>
        <button onClick={onBack}
          style={{ padding: "12px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, background: "var(--card2)", color: "var(--text2)", border: "1px solid var(--border)" }}>
          ← Back
        </button>

        <button onClick={onAnalyze} disabled={!canAnalyze || loading}
          style={{ flex: 1, padding: "12px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: canAnalyze && !loading ? "pointer" : "not-allowed", background: canAnalyze && !loading ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--card2)", color: canAnalyze && !loading ? "#fff" : "var(--text3)", boxShadow: canAnalyze && !loading ? "0 4px 20px rgba(79,142,247,0.35)" : "none" }}>
          {loading === "single" ? (
            <>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Analyzing…
            </>
          ) : "Analyze one attribute →"}
        </button>

        <button onClick={onAnalyzeAll} disabled={!config.outcomeCol || loading}
          style={{ flex: 1, padding: "12px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: config.outcomeCol && !loading ? "pointer" : "not-allowed", background: config.outcomeCol && !loading ? "linear-gradient(135deg, #f75555, #f97316)" : "var(--card2)", color: config.outcomeCol && !loading ? "#fff" : "var(--text3)" }}>
          {loading === "all" ? (
            <>
              <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Running full audit…
            </>
          ) : "⚡ Run full audit"}
        </button>
      </div>
    </div>
  );
}