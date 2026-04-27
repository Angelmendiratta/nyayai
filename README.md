# NyayAI ⚖️ — AI Bias Auditor for India

> India's first AI-powered bias auditor built specifically for government schemes and public sector AI decisions.

**Live Demo:** https://nyayai-liard.vercel.app/  
**Built for:** Build with AI — Solution Challenge 2026 (Hack2Skill)  
**Problem Track:** Unbiased AI Decision

---

## The Problem

India has over 500 million people whose lives are shaped by AI-driven decisions in government schemes like PMAY, PM-KISAN, NREGA, and Jan Dhan. These systems decide who gets housing, crop insurance, employment, and banking access.

**The problem:** None of these systems are audited for bias. Tools like IBM AIF360 and Microsoft Fairlearn exist — but they're built for Western datasets with race/gender attributes. They don't understand caste, religion, state/region, rural-urban divide, or language group — the attributes that define inequality in India.

**NyayAI fills this gap.**

---

## What It Does

- Upload any beneficiary CSV from a government scheme
- Select the outcome column (approved/rejected) and the sensitive attribute to test
- Get instant fairness metrics: **Disparate Impact** and **Demographic Parity Difference**
- Receive a plain-language explanation from **Gemini AI** in English or Hindi
- Run a **Full Audit** — analyze all India-specific attributes simultaneously in one click
- Download a CSV bias report for policy makers and NGOs

---

## Screenshots

### Upload & Configure
Upload beneficiary data or use the built-in PMAY sample dataset with 20 records.

### Single Attribute Analysis
Test for bias on one attribute-caste, gender, state, etc. — with approval rate charts and AI explanation.

### Full Audit Mode
Click "Run full audit" to analyze caste, gender, state, rural_urban, and age_group simultaneously. Results sorted by severity.

---

## India-Specific Sensitive Attributes

Unlike existing tools, NyayAI tracks:

| Attribute | Why it matters |
|-----------|---------------|
| caste | SC/ST/OBC/General disparities in scheme access |
| religion | Minority group exclusion patterns |
| state / region | Geographic bias in central scheme distribution |
| rural_urban | Urban bias in digital-first schemes |
| language | Non-Hindi speaker exclusion |
| age_group | Age discrimination in employment schemes |
| tribe | ST community access gaps |
| district | Intra-state regional inequality |

---

## Bias Metrics Explained

**Disparate Impact (DI):** Ratio of lowest to highest approval rate across groups. The 80% rule requires DI ≥ 0.8. Below 0.8 indicates legally significant bias.

**Demographic Parity Difference:** The gap in approval rates between the best and worst served group. Below 5% = fair, 5-15% = moderate, above 15% = severe.

| Bias Level | Disparate Impact | Gap |
|------------|-----------------|-----|
| Low | ≥ 0.9 | ≤ 5% |
| Moderate | ≥ 0.8 | ≤ 15% |
| High | ≥ 0.6 | any |
| Severe | < 0.6 | any |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Backend | Python, FastAPI |
| AI | Google Gemini 2.0 Flash |
| Bias metrics | Disparate Impact, Demographic Parity (custom implementation) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Run Locally

### Requirements
- Python 3.11
- Node.js 20+
- Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
set GEMINI_API_KEY=your_key_here
uvicorn main:app --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Analyze bias for one sensitive attribute |
| POST | `/analyze-all` | Full audit across all India-specific attributes |
| GET | `/sample-data` | Returns PMAY sample beneficiary CSV |
| GET | `/health` | Health check |

---

## Real-World Use Cases

- **PMAY (Housing):** Detect if SC/ST households are being approved at lower rates than General category
- **PM-KISAN (Farming):** Check if small farmers from certain states receive less benefit
- **NREGA (Employment):** Identify if women or tribal communities face barriers in work allocation
- **Jan Dhan (Banking):** Audit if rural residents face account approval bias

---

## Why This Wins

1. **No existing tool does this for India** — IBM, Microsoft, and Holistic AI all target Western regulatory frameworks
2. **Non-technical users can use it** — No Python knowledge required, just upload a CSV
3. **Gemini AI makes results understandable** — Plain language in English or Hindi
4. **Full audit in one click** — Test all attributes simultaneously, not one at a time
5. **Built for scale** — Policy makers can upload 100,000+ record datasets

---

## Team

Built by Angel Mendiratta for the Build with AI: Solution Challenge 2026.

---

## License

MIT
