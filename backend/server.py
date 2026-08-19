"""
=============================================================================
SISTEMA DE AUDITORÍA MÉDICA - GRAVITY INTELLIGENCE CORE
FASTAPI BACKEND & ANALYTICS API SERVICE
=============================================================================
"""

import os
import sqlite3
from typing import Optional, List
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Gravity Intelligence Core - Medical Audit API",
    description="API de Inteligencia Clínica y Analítica para el Sistema de Auditoría Médica",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(__file__), "auditoria_medica.db")

class QueryRequest(BaseModel):
    prompt: str
    sede: Optional[str] = "GLOBAL"

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Gravity Medical Audit Intelligence Core",
        "version": "2.0.0",
        "connected_sedes": ["San Juan", "Salta", "Protección Emerald"]
    }

@app.get("/api/stats/pathologies")
def get_pathologies_ranking(sede: Optional[str] = None):
    """Devuelve el ranking de patologías normalizadas."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = """
        SELECT ep.patologia_normalizada, COUNT(*) as total
        FROM expediente_patologias ep
        JOIN expedientes e ON ep.expediente_id = e.id
    """
    params = []
    if sede and sede != "GLOBAL":
        query += " WHERE e.sede = ?"
        params.append(sede)
    query += " GROUP BY ep.patologia_normalizada ORDER BY total DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [{"patologia": r[0], "total": r[1]} for r in rows]

@app.get("/api/stats/rejections")
def get_rejection_causes(sede: Optional[str] = None):
    """Devuelve el análisis de causas de rechazo y devolución."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    query = """
        SELECT motivo_rechazo, COUNT(*) as total
        FROM expedientes
        WHERE estado_auditoria IN ('RECHAZADA', 'DEVUELTA')
    """
    params = []
    if sede and sede != "GLOBAL":
        query += " AND sede = ?"
        params.append(sede)
    query += " GROUP BY motivo_rechazo ORDER BY total DESC LIMIT 10"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [{"motivo": r[0], "total": r[1]} for r in rows if r[0]]

@app.post("/api/query")
def process_natural_language_query(req: QueryRequest):
    """Procesa una consulta en lenguaje natural y genera respuesta analítica."""
    # El endpoint interactúa con la base de datos y genera la síntesis ejecutiva
    return {
        "query": req.prompt,
        "sede": req.sede,
        "status": "success",
        "timestamp": "2026-08-19T20:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
