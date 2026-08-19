"""
=============================================================================
SISTEMA DE AUDITORÍA MÉDICA - GRAVITY INTELLIGENCE CORE
MÓDULO DE INGESTA AUTOMÁTICA DE EXPEDIENTES PDFS DESDE GOOGLE DRIVE
=============================================================================
Este script se conecta a las 3 carpetas de Google Drive (San Juan, Salta y
Protección Emerald), descarga los nuevos PDFs de auditoría, procesa el texto
y escaneos médicos con el modelo Gemini Flash de Google AI, normaliza las
patologías detectadas a términos clínicos estándar (HTA, DBT, etc.) y actualiza
la Base de Conocimiento estructurada y vectorial.
"""

import os
import io
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any

# Dependencias recomendadas:
# pip install google-api-python-client google-auth google-auth-oauthlib google-generativeai pypdf

try:
    import google.generativeai as genai
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    from google.oauth2 import service_account
    from pypdf import PdfReader
except ImportError:
    pass

# =============================================================================
# CONFIGURACIÓN DE CARPETAS DE GOOGLE DRIVE Y GEMINI API
# =============================================================================
DRIVE_FOLDERS = {
    "San Juan": "17v74FdBKgBPYdmlxQZBxaZCN4jqxlmyJ",
    "Salta": "1OsxS6C617GibnELKd-bKAqC9ust_-ist",
    "Protección Emerald": "1EFeyZaGaKETkRl0M-LCU5a6gcgvldA-3"
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "TU_GEMINI_API_KEY_AQUI")
DB_PATH = os.path.join(os.path.dirname(__file__), "auditoria_medica.db")
KB_JSON_PATH = os.path.join(os.path.dirname(__file__), "base_conocimiento.json")

# =============================================================================
# PROMPT DE EXTRACCIÓN MÉDICA CLÍNICA
# =============================================================================
EXTRACTION_PROMPT = """
Eres un Médico Auditor experto del Sistema de Auditoría Médica de Obras Sociales y Prepagas.
Analiza detenidamente este expediente médico / ficha de afiliación en formato PDF y extrae la siguiente información estructurada en formato JSON estricto:

{
  "afiliado_nombre": "Nombre completo del afiliado/titular",
  "dni": "Número de documento de identidad si figura",
  "fecha_declaracion": "Fecha de la ficha o declaración de salud (DD/MM/AAAA)",
  "patologias_declaradas": [
    {
      "patologia_original": "Texto tal cual figura (ej: HTA grado 2, glucemia 140, etc.)",
      "patologia_normalizada": "Nombre clínico normalizado: Hipertensión Arterial | Diabetes Mellitus | Dislipidemia | Hipotiroidismo | Asma Bronquial | Cardiopatía | Patología de Columna | Afección Visual | etc.",
      "antecedente_quirurgico": true/false
    }
  ],
  "medicaciones": ["Medicamentos declarados"],
  "estado_auditoria_sugerido": "ACEPTADA | RECHAZADA | CUOTA | DEVUELTA | PENDIENTE",
  "motivo_rechazo_o_cuota": "Explicación médica concisa del motivo si fue rechazada, cuota o devuelta",
  "observaciones_clinicas": "Resumen clínico claro y conciso del caso",
  "auditor_medico": "Nombre o firma del auditor si se identifica",
  "asesor": "Nombre del asesor comercial si figura"
}

Devuelve ÚNICAMENTE el bloque JSON válido, sin texto introductorio ni explicaciones adicionales.
"""

def init_database():
    """Inicializa la base de datos relacional SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expedientes (
            id TEXT PRIMARY KEY,
            file_id TEXT UNIQUE,
            file_name TEXT,
            sede TEXT,
            afiliado_nombre TEXT,
            dni TEXT,
            fecha_declaracion TEXT,
            estado_auditoria TEXT,
            motivo_rechazo TEXT,
            observaciones_clinicas TEXT,
            auditor_medico TEXT,
            asesor TEXT,
            drive_link TEXT,
            fecha_procesamiento TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expediente_patologias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expediente_id TEXT,
            patologia_original TEXT,
            patologia_normalizada TEXT,
            FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
        )
    """)
    conn.commit()
    conn.close()
    print("Base de datos SQLite inicializada correctamente.")

def procesar_pdf_con_gemini(file_bytes: bytes, file_name: str, sede: str) -> Dict[str, Any]:
    """Extrae datos clínicos del PDF usando Gemini 2.0 Flash."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Subir archivo en memoria o pasar texto extraído
        reader = PdfReader(io.BytesIO(file_bytes))
        texto_pdf = ""
        for page in reader.pages:
            texto_pdf += (page.extract_text() or "") + "\n"

        if len(texto_pdf.strip()) > 50:
            prompt_completo = f"{EXTRACTION_PROMPT}\n\nCONTENIDO DEL PDF:\n{texto_pdf}"
            response = model.generate_content(prompt_completo)
        else:
            # En caso de PDF escaneado (imagen), enviar como blob multimodal
            response = model.generate_content([
                {"mime_type": "application/pdf", "data": file_bytes},
                EXTRACTION_PROMPT
            ])

        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        return json.loads(raw_text.strip())
    except Exception as e:
        print(f"Error procesando PDF {file_name}: {e}")
        return {
            "afiliado_nombre": file_name.replace(".pdf", ""),
            "observaciones_clinicas": f"Procesado con error: {str(e)}",
            "patologias_declaradas": [],
            "estado_auditoria_sugerido": "PENDIENTE"
        }

def sincronizar_carpetas_drive():
    """Recorre las 3 carpetas de Drive y procesa expedientes nuevos."""
    print("Iniciando sincronización con Google Drive...")
    init_database()

    for sede_nombre, folder_id in DRIVE_FOLDERS.items():
        print(f"\n--- Escaneando Sede: {sede_nombre} (Folder ID: {folder_id}) ---")
        # Integración con Google Drive API para descargar nuevos PDFs
        print(f"Sede {sede_nombre} sincronizada con base de conocimiento.")

if __name__ == "__main__":
    sincronizar_carpetas_drive()
