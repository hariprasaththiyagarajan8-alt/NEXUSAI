"""
FastAPI + SQLAlchemy + Scikit-learn + Google Gemini API Reference Backend
M.Sc. Data Science Project: AI-Powered Sales Analytics & Business Intelligence System
"""
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score, silhouette_score
from google import genai

app = FastAPI(
    title="NexusBI — AI-Powered Sales Analytics & Business Intelligence API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictionRequest(BaseModel):
    category: str = "Electronics"
    region: str = "North"
    quantity: int = 10
    unitPrice: float = 500.0
    discount: float = 0.05
    horizonMonths: int = 6


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "engine": "FastAPI + Pandas + Scikit-learn + PostgreSQL"}
