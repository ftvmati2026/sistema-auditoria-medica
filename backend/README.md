# Gravity Medical Audit Intelligence Core (Backend & Ingestor)

Este módulo proporciona la infraestructura de **Inteligencia Artificial Médica y Procesamiento Automático de Documentos** para el Sistema de Gestión de Auditoría Médica.

## 🚀 Características Principales

1. **Ingestor Inteligente de Google Drive (`ingestor_drive.py`):**
   - Conexión con las carpetas de Google Drive de **San Juan**, **Salta** y **Protección Emerald**.
   - Extracción de datos clínicos mediante **Gemini 2.0 Flash / Vision**.
   - Normalización ontológica automática de patologías (`HTA`, `DBT`, `Dislipidemia`, `Hipotiroidismo`, etc.).
   - Almacenamiento en base de datos estructurada `auditoria_medica.db`.

2. **Servidor API Analítico (`server.py`):**
   - Endpoints REST para consultas en lenguaje natural (`/api/query`).
   - Ranking de patologías (`/api/stats/pathologies`).
   - Análisis de motivos de rechazo (`/api/stats/rejections`).

---

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Configurar la API Key de Gemini
Establece tu clave en una variable de entorno o en el archivo:
```bash
export GEMINI_API_KEY="TU_API_KEY"       # Linux / macOS
set GEMINI_API_KEY="TU_API_KEY"          # Windows CMD
$env:GEMINI_API_KEY="TU_API_KEY"         # Windows PowerShell
```

### 3. Ejecutar la sincronización de Google Drive
```bash
python ingestor_drive.py
```

### 4. Iniciar el servidor API (Opcional)
```bash
python server.py
```
El servidor estará disponible en `http://localhost:8000`.
