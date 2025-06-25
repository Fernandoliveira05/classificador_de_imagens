
"""
Servidor Python de exemplo para rodar modelos YOLO .pt localmente
Instale as dependências: pip install fastapi uvicorn torch torchvision pillow ultralytics opencv-python

Para executar: uvicorn python_server_example:app --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
import cv2
import numpy as np
from PIL import Image
import torch
from ultralytics import YOLO
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YOLO Local Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    image: str 
    threshold: float = 0.5
    device: str = "cpu"

class BoundingBox(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float

class Prediction(BaseModel):
    label: str
    confidence: float
    bbox: list[float]

class PredictionResponse(BaseModel):
    predictions: list[Prediction]
    model_info: dict

model = None
model_path = None

def load_model(path: str = "resnet18_openimages.pth"):
    """Carrega o modelo YOLO"""
    global model, model_path
    try:
        logger.info(f"Carregando modelo: {path}")
        model = YOLO(path)
        model_path = path
        logger.info("Modelo carregado com sucesso!")
        return True
    except Exception as e:
        logger.error(f"Erro ao carregar modelo: {e}")
        return False

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decodifica imagem base64 para array numpy"""
    try:
        # Decodificar base64
        image_data = base64.b64decode(base64_string)
        
        # Converter para PIL Image
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Converter para RGB se necessário
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Converter para numpy array
        image_array = np.array(pil_image)
        
        return image_array
    except Exception as e:
        logger.error(f"Erro ao decodificar imagem: {e}")
        raise HTTPException(status_code=400, detail="Erro ao processar imagem")

@app.on_event("startup")
async def startup_event():
    """Carrega o modelo na inicialização do servidor"""
    # SUBSTITUA ESTE CAMINHO PELO CAMINHO DO SEU MODELO .pt
    model_file = "yolo11n.pt"  # ou "caminho/para/seu/modelo.pt"
    
    if not load_model(model_file):
        logger.warning("Não foi possível carregar o modelo na inicialização")

@app.get("/health")
async def health_check():
    """Endpoint para verificar se o servidor está funcionando"""
    global model
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": model_path
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Endpoint principal para predições"""
    global model
    
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo não carregado. Verifique os logs do servidor.")
    
    try:
        # Decodificar a imagem
        image = decode_base64_image(request.image)
        
        # Fazer a predição
        logger.info("Executando predição...")
        results = model(image, conf=request.threshold, device=request.device)
        
        predictions = []
        
        # Processar resultados
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    # Extrair coordenadas da bounding box
                    xyxy = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    
                    # Obter nome da classe
                    class_name = model.names[class_id] if class_id < len(model.names) else f"Classe_{class_id}"
                    
                    prediction = Prediction(
                        label=class_name,
                        confidence=confidence,
                        bbox=[float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])]
                    )
                    predictions.append(prediction)
        
        logger.info(f"Predição concluída. {len(predictions)} objetos detectados.")
        
        return PredictionResponse(
            predictions=predictions,
            model_info={
                "model_path": model_path,
                "device": request.device,
                "threshold": request.threshold,
                "total_detections": len(predictions)
            }
        )
        
    except Exception as e:
        logger.error(f"Erro na predição: {e}")
        raise HTTPException(status_code=500, detail=f"Erro na predição: {str(e)}")

@app.post("/load_model")
async def load_custom_model(model_path: str):
    """Endpoint para carregar um modelo personalizado"""
    if load_model(model_path):
        return {"status": "success", "message": f"Modelo {model_path} carregado com sucesso"}
    else:
        raise HTTPException(status_code=400, detail="Falha ao carregar o modelo")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)