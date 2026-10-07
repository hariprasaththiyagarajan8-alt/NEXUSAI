# Google Gemini AI Integration (`GEMINI_AI_DOCUMENTATION.md`)

## Strict Anti-Fabrication Architecture

Gemini AI is used strictly as an **interpretation and recommendation layer**, never as a source of raw calculations:

1. **Step 1 (Verified Calculation)**: The backend calculates exact KPIs, regional growth rates, product margins, RFM cluster counts, and ML forecast metrics (`VerifiedAnalyticsPayload`).
2. **Step 2 (Server-Side Invocation)**: The backend sends the structured JSON payload to `gemini-3.8-flash` using the official `@google/genai` SDK (`process.env.GEMINI_API_KEY`). The API key is never exposed to the browser.
3. **Step 3 (Controlled System Instruction & Schema)**: Gemini is constrained by a strict system prompt prohibiting invented numbers and uses `responseSchema` (`application/json`) to return structured sections:
   - `executiveSummary`
   - `keyFindings`
   - `businessRisks`
   - `businessOpportunities`
   - `recommendations`
   - `forecastInterpretation`
   - `nextActions`
4. **Step 4 (Resilient Fallback)**: If the Gemini API is unreachable or unconfigured, the system automatically falls back to a deterministic rule-based BI engine using the exact same verified metrics.
