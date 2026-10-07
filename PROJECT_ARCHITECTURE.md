# Project Architecture (`PROJECT_ARCHITECTURE.md`)

## System Overview

NexusBI is architected as a modular, layered Data Science and Business Intelligence platform separating data ingestion, cleaning, relational persistence, statistical/ML computation, generative AI interpretation, and presentation.

```text
USER
 ↓
REACT + TYPESCRIPT FRONTEND (Vite + Tailwind CSS + Recharts)
 ↓
EXPRESS / FASTAPI ANALYTICS BACKEND
 ↓
┌──────────────────────────────────────────┐
│ PostgreSQL Relational Schema             │
│ users · sales · customers · products     │
│ predictions · ai_insights                │
└──────────────────────────────────────────┘
 ↓
┌──────────────────────────────────────────┐
│ Data Cleaning & Exploratory Analytics    │
│ Imputation · Deduplication · KPI Engine  │
└──────────────────────────────────────────┘
 ↓
┌──────────────────────────────────────────┐
│ Machine Learning Workbench               │
│ Gradient Boosting · K-Means++ · iForest  │
└──────────────────────────────────────────┘
 ↓
┌──────────────────────────────────────────┐
│ Server-Side Google Gemini API            │
│ Verified JSON → Executive Insights       │
└──────────────────────────────────────────┘
 ↓
BUSINESS RECOMMENDATIONS & POWER BI EXPORTS
```

## Directory Structure

- `src/server/`: Full-stack data pipeline, relational store, analytics service, ML algorithms, and Gemini AI service.
- `src/pages/`: 13 enterprise dashboard pages (`ExecutiveDashboard`, `DataUploadPage`, `DataQualityPage`, `SalesAnalyticsPage`, `ProductAnalysisPage`, `CustomerAnalysisPage`, `RegionalAnalysisPage`, `MachineLearningPage`, `PredictionsPage`, `AIInsightsPage`, `ReportsPage`, `AboutPage`, `SettingsPage`).
- `src/components/`: Reusable UI components (`GlobalFilterBar`, `SalesDataTable`).
- `backend/`: Python FastAPI + Scikit-learn reference implementation.
- `database/schema.sql`: Complete PostgreSQL DDL schema with foreign keys, constraints, and B-tree indexes.
