export interface LocalYOLOPrediction {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export interface LocalYOLOResult {
  predictions: LocalYOLOPrediction[];
  processingTime: string;
  modelVersion: string;
  categories: string[];
}

export interface LocalModelConfig {
  modelPath?: string;
  threshold?: number;
  device?: 'cpu' | 'gpu';
  modelName?: string;
  serverUrl?: string;
}

class LocalYOLOService {
  private config: LocalModelConfig = {
    threshold: 0.5,
    device: 'cpu',
    modelName: 'Modelo Local YOLO',
    serverUrl: 'http://localhost:8000' // Servidor Python local padrão
  };

  setConfig(config: LocalModelConfig) {
    this.config = { ...this.config, ...config };
    console.log('Configuração do modelo local definida:', this.config);
  }

  getConfig(): LocalModelConfig {
    return { ...this.config };
  }

  async predict(imageData: string): Promise<LocalYOLOResult> {
    const startTime = performance.now();
    
    console.log('Enviando imagem para servidor local...');
    
    try {
      // Converter base64 para blob se necessário
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      const response = await fetch(`${this.config.serverUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          threshold: this.config.threshold,
          device: this.config.device
        })
      });

      if (!response.ok) {
        throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const endTime = performance.now();
      const processingTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;

      // Mapear para o formato esperado
      const formattedPredictions: LocalYOLOPrediction[] = result.predictions?.map((pred: any) => ({
        label: pred.label || pred.class || 'Objeto',
        score: pred.confidence || pred.score || 0,
        box: {
          xmin: pred.bbox?.[0] || pred.box?.xmin || 0,
          ymin: pred.bbox?.[1] || pred.box?.ymin || 0,
          xmax: pred.bbox?.[2] || pred.box?.xmax || 0,
          ymax: pred.bbox?.[3] || pred.box?.ymax || 0
        }
      })) || [];

      // Extrair categorias únicas
      const categories = [...new Set(formattedPredictions.map(p => p.label))];

      return {
        predictions: formattedPredictions,
        processingTime,
        modelVersion: this.config.modelName || 'Modelo Local',
        categories: categories.length > 0 ? categories : ['Objetos Detectados']
      };

    } catch (error) {
      console.error('Erro na predição local:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Servidor local não está rodando. Inicie o servidor Python na porta 8000.');
      }
      
      throw new Error(`Falha na predição local: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      return response.ok;
    } catch (error) {
      console.error('Falha ao conectar com servidor local:', error);
      return false;
    }
  }
}

export const localYoloService = new LocalYOLOService();