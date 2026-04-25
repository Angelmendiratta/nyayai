const BIAS_CONFIG = {
  Low:      { color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)" },
  Moderate: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)" },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.3)" },
  Severe:   { color: "#f75555", bg: "rgba(247,85,85,0.1)",   border: "rgba(247,85,85,0.3)" },
};

const BAR_COLORS = ["#4f8ef7","#7c5cfc","#00d4a8","#fbbf24","#f97316","#f75555"];

export default function MultiResults({ data, config, onReset, onBack }) {
  const { results, attributes_analyzed, total_rows, outcome_col, most_biased } = data;

  const downloadCSV = () => {
    const rows = [["Attribute","Bias Level","Disparate Impact","Max Gap %","Groups","Most Approved","Least Approved"]];
    results.forEach(r => {
      if (r.error) return;
      const rates = r.approval_rates || {};
      const maxG = Object.entries(rates).sort((a,b) => b[1]-a[1])[0];
      const minG = Object.entries(rates).sort((a,b) => a[1]-b[1])[0];
      rows.push([r.attribute, r.bias_level, r.disparate_impact, r.demographic_parity_diff, Object.keys(rates).join("|"), maxG ? `${maxG[0]}(${maxG[1]}%)` : "", minG ? `${minG[0]}(${minG[1]}%)` : ""]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `nyayai-full-audit-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(247,85,85,0.1)", border: "1px solid rgba(247,85,85,0.3)", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700, color: "#f75555", marginBottom: 12 }}>
          Full Bias Audit — {attributes_analyzed.length} attributes analyzed
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", marginBottom: 6 }}>Complete Bias Report</h2>
        <p style={{ color: "var(--text2)", fontSize: 14 }}>
          Outcome: <span style={{ color: "var(--accent)", fontWeight: 600, fontFamily: "var(--mono)" }}>{outcome_col}</span> · <strong>{total_rows.toLocaleString()}</strong> records · Most biased attribute: <span style={{ color: "#f75555", fontWeight: 600 }}>{most_biased}</span>
        </p>
      </div>

      {/* Summary row */}
      <div className="fade-up-1" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: "2rem" }}>
        {["Severe","High","Moderate","Low"].map(level => {
          const count = results.filter(r => r.bias_level === level).length;
          const bc = BIAS_CONFIG[level];
          return (
            <div key={level} style={{ background: bc.bg, border: `1px solid ${bc.border}`, borderRadius: "var(--radius)", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: bc.color }}>{count}</div>
              <div style={{ fontSize: 12, color: bc.color, fontWeight: 600, marginTop: 2 }}>{level}</div>
            </div>
          );
        })}
      </div>

      {/* Per-attribute cards */}
      <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: "2rem" }}>
        {results.map((r, idx) => {
          if (r.error) return (
            <div key={r.attribute} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius2)", padding: "1.25rem 1.5rem", color: "var(--text2)", fontSize: 14 }}>
              ⚠ Could not analyze <strong>{r.attribute}</strong>: {r.error}
            </div>
          );
          const bc = BIAS_CONFIG[r.bias_level] || BIAS_CONFIG.Low;
          const rates = r.approval_rates || {};
          const maxRate = Math.max(...Object.values(rates), 1);
          const sortedRates = Object.entries(rates).sort((a,b) => b[1]-a[1]);
          return (
            <div key={r.attribute} style={{ background: "var(--card)", border: `1px solid ${bc.border}`, borderRadius: "var(--radius2)", overflow: "hidden" }}>
              {/* Card header */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, background: bc.bg }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: bc.color, boxShadow: `0 0 8px ${bc.color}` }} />
                <span style={{ fontWeight: 700, fontSize: 15, fontFamily: "var(--mono)", color: "var(--text)" }}>{r.attribute}</span>
                <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: bc.bg, color: bc.color, border: `1px solid ${bc.border}` }}>{r.bias_level} Bias</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text2)", fontFamily: "var(--mono)" }}>DI: {r.disparate_impact} · Gap: {r.demographic_parity_diff}%</span>
              </div>

              {/* Bar chart + explanation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                <div style={{ padding: "1.25rem 1.5rem", borderRight: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 14, letterSpacing: "0.05em" }}>APPROVAL RATES</div>
                  {sortedRates.map(([group, rate], i) => (
                    <div key={group} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: "var(--text)" }}>{group}</span>
                        <span style={{ fontFamily: "var(--mono)", color: BAR_COLORS[i % BAR_COLORS.length], fontWeight: 600 }}>{rate.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(rate/maxRate)*100}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 3, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 14, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 16, height: 16, background: "linear-gradient(135deg,#4285f4,#0f9d58)", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>G</span>
                    GEMINI EXPLANATION
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, fontWeight: 300 }}>{r.ai_explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="fade-up-3" style={{ display: "flex", gap: 12 }}>
        <button onClick={onBack} style={{ padding: "12px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 500, background: "var(--card2)", color: "var(--text2)", border: "1px solid var(--border)" }}>← Back</button>
        <button onClick={downloadCSV} style={{ padding: "12px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 600, background: "var(--card2)", color: "var(--text)", border: "1px solid var(--border2)" }}>↓ Download CSV report</button>
        <button onClick={onReset} style={{ flex: 1, padding: "12px 24px", borderRadius: "var(--radius)", fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", boxShadow: "0 4px 20px rgba(79,142,247,0.35)" }}>Analyze another dataset →</button>
      </div>
    </div>
  );
}