from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import os
from io import StringIO

app = FastAPI(title="NyayAI Bias Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


class AnalyzeRequest(BaseModel):
    csv_data: Optional[str] = None
    predictions: Optional[List[dict]] = None
    outcome_col: str
    sensitive_col: str
    positive_outcome: Optional[str] = "1"
    language: Optional[str] = "English"


class AnalyzeAllRequest(BaseModel):
    csv_data: Optional[str] = None
    predictions: Optional[List[dict]] = None
    outcome_col: str
    positive_outcome: Optional[str] = "1"
    language: Optional[str] = "English"


def compute_bias_metrics(df, outcome_col, sensitive_col, positive_outcome):
    df = df.copy()
    df[outcome_col] = df[outcome_col].astype(str)
    groups = df[sensitive_col].unique().tolist()
    approval_rates = {}
    group_counts = {}
    for g in groups:
        subset = df[df[sensitive_col] == g]
        rate = (subset[outcome_col] == str(positive_outcome)).mean()
        approval_rates[str(g)] = round(float(rate) * 100, 2)
        group_counts[str(g)] = int(len(subset))
    rates = list(approval_rates.values())
    max_rate = max(rates) if rates else 1
    min_rate = min(rates) if rates else 0
    disparate_impact = round(min_rate / max_rate, 4) if max_rate > 0 else 1.0
    demographic_parity_diff = round(max_rate - min_rate, 2)
    if disparate_impact >= 0.9 and demographic_parity_diff <= 5:
        bias_level = "Low"
    elif disparate_impact >= 0.8 and demographic_parity_diff <= 15:
        bias_level = "Moderate"
    elif disparate_impact >= 0.6:
        bias_level = "High"
    else:
        bias_level = "Severe"
    return {
        "attribute": sensitive_col,
        "groups": group_counts,
        "disparate_impact": disparate_impact,
        "demographic_parity_diff": demographic_parity_diff,
        "approval_rates": approval_rates,
        "bias_level": bias_level,
    }


def get_gemini_explanation(metrics, language):
    if not GEMINI_API_KEY:
        return generate_fallback_explanation(metrics, language)
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        lang_map = {
            "Hindi":   "You MUST respond entirely in Hindi using Devanagari script. Do not use English at all.",
            
        }
        lang_instruction = lang_map.get(language, "Respond in English.")
        prompt = f"""You are NyayAI, an AI bias auditor for Indian government schemes.
LANGUAGE RULE: {lang_instruction}

Attribute analyzed: {metrics['attribute']}
Approval rates per group: {metrics['approval_rates']}
Disparate Impact score: {metrics['disparate_impact']} (ideal=1.0, minimum acceptable=0.8)
Demographic Parity Difference: {metrics['demographic_parity_diff']}%
Bias Level: {metrics['bias_level']}

In under 100 words: explain what bias was found, which group is most disadvantaged, and give one fix."""
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return generate_fallback_explanation(metrics, language)


def generate_fallback_explanation(metrics, language):
    rates = metrics["approval_rates"]
    if not rates:
        return "Unable to compute explanation."
    max_group = max(rates, key=rates.get)
    min_group = min(rates, key=rates.get)
    diff = rates[max_group] - rates[min_group]
    bias = metrics["bias_level"]
    if language == "Hindi":
        return (f"'{metrics['attribute']}' ke aadhar par {bias.lower()} pakshapat paya gaya. "
                f"'{max_group}' ko {rates[max_group]:.1f}% anumodan mila, jabki "
                f"'{min_group}' ko kewal {rates[min_group]:.1f}% mila ({diff:.1f}% ka antar). "
                f"Sujhav: '{min_group}' samuh ke data ki samiksha karein.")
    else:
        return (f"{bias} bias on '{metrics['attribute']}'. "
                f"'{max_group}' gets {rates[max_group]:.1f}% vs '{min_group}' gets {rates[min_group]:.1f}% — {diff:.1f}% gap. "
                f"Fix: Review data collection for '{min_group}' group and apply re-weighting.")


@app.post("/analyze")
async def analyze_bias(request: AnalyzeRequest):
    try:
        if request.csv_data:
            df = pd.read_csv(StringIO(request.csv_data))
        elif request.predictions:
            df = pd.DataFrame(request.predictions)
        else:
            raise HTTPException(status_code=400, detail="Provide csv_data or predictions")
        if request.outcome_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{request.outcome_col}' not found. Available: {list(df.columns)}")
        if request.sensitive_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{request.sensitive_col}' not found. Available: {list(df.columns)}")
        metrics = compute_bias_metrics(df, request.outcome_col, request.sensitive_col, request.positive_outcome)
        explanation = get_gemini_explanation(metrics, request.language or "English")
        metrics["ai_explanation"] = explanation
        metrics["available_columns"] = list(df.columns)
        metrics["total_rows"] = len(df)
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-all")
async def analyze_all(request: AnalyzeAllRequest):
    try:
        if request.csv_data:
            df = pd.read_csv(StringIO(request.csv_data))
        elif request.predictions:
            df = pd.DataFrame(request.predictions)
        else:
            raise HTTPException(status_code=400, detail="Provide csv_data or predictions")

        if request.outcome_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Outcome column '{request.outcome_col}' not found")

        INDIA_ATTRS = ["caste", "religion", "state", "region", "language",
                       "rural_urban", "gender", "age_group", "tribe", "district"]

        found_attrs = [c for c in df.columns if c.lower() in INDIA_ATTRS]

        if not found_attrs:
            raise HTTPException(status_code=400, detail="No India-specific sensitive attributes found in dataset")

        results = []
        for attr in found_attrs:
            try:
                metrics = compute_bias_metrics(df, request.outcome_col, attr, request.positive_outcome)
                explanation = get_gemini_explanation(metrics, request.language or "English")
                metrics["ai_explanation"] = explanation
                metrics["total_rows"] = len(df)
                results.append(metrics)
            except Exception as e:
                results.append({"attribute": attr, "error": str(e)})

        bias_order = {"Severe": 0, "High": 1, "Moderate": 2, "Low": 3}
        results.sort(key=lambda x: bias_order.get(x.get("bias_level", "Low"), 4))

        return {
            "attributes_analyzed": found_attrs,
            "total_rows": len(df),
            "outcome_col": request.outcome_col,
            "results": results,
            "most_biased": results[0]["attribute"] if results else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sample-data")
async def get_sample_data():
    sample = """name,gender,caste,state,rural_urban,age_group,income_level,approved
Amit Sharma,Male,General,Maharashtra,Urban,25-35,50000,1
Priya Devi,Female,SC,Bihar,Rural,25-35,18000,0
Rahul Singh,Male,OBC,UP,Rural,36-50,22000,1
Sunita Bai,Female,ST,Rajasthan,Rural,36-50,12000,0
Mohammed Ali,Male,OBC,Karnataka,Urban,25-35,35000,1
Kavitha R,Female,General,Tamil Nadu,Urban,25-35,45000,1
Ramesh Yadav,Male,OBC,Bihar,Rural,51-65,15000,0
Lakshmi S,Female,SC,Andhra Pradesh,Rural,25-35,16000,0
Arjun Nair,Male,General,Kerala,Urban,36-50,60000,1
Geeta Meena,Female,ST,Madhya Pradesh,Rural,25-35,11000,0
Vijay Kumar,Male,SC,UP,Rural,51-65,14000,0
Ananya Gupta,Female,General,Delhi,Urban,25-35,55000,1
Raju Bind,Male,OBC,Bihar,Rural,36-50,19000,0
Deepa Thomas,Female,General,Kerala,Urban,36-50,48000,1
Suresh Chamar,Male,SC,Rajasthan,Rural,51-65,13000,0
Pooja Verma,Female,OBC,MP,Rural,25-35,21000,1
Hassan Khan,Male,OBC,UP,Urban,25-35,32000,1
Saraswati Bai,Female,ST,Chhattisgarh,Rural,36-50,10000,0
Naresh Jat,Male,OBC,Haryana,Rural,36-50,24000,1
Lata Kumari,Female,SC,Bihar,Rural,51-65,12000,0"""
    return {"csv": sample}


@app.get("/health")
async def health():
    return {"status": "ok", "gemini_configured": bool(GEMINI_API_KEY)}