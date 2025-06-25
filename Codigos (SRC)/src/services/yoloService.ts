
import { pipeline, env } from '@huggingface/transformers';

// Configure para usar modelos locais se necessário
env.allowRemoteModels = true;
env.allowLocalModels = true;

export interface YOLOPrediction {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export interface YOLOResult {
  predictions: YOLOPrediction[];
  processingTime: string;
  modelVersion: string;
  categories: string[];
}

export interface CustomModelConfig {
  modelId: string; // Nome do modelo no Hugging Face ou URL
  threshold?: number;
  device?: 'webgpu' | 'cpu' | 'auto';
  modelName?: string; // Nome para exibição
}

class YOLOService {
  private detector: any = null;
  private isLoading = false;
  private currentModelConfig: CustomModelConfig = {
    modelId: 'Xenova/detr-resnet-50',
    threshold: 0.5,
    device: 'auto',
    modelName: 'DETR ResNet-50 (Padrão)'
  };

  setCustomModel(config: CustomModelConfig) {
    // Limpar modelo atual se mudou
    if (config.modelId !== this.currentModelConfig.modelId) {
      this.detector = null;
    }
    
    this.currentModelConfig = {
      ...this.currentModelConfig,
      ...config
    };
    
    console.log('Configuração do modelo personalizado definida:', this.currentModelConfig);
  }

  getCurrentModelConfig(): CustomModelConfig {
    return { ...this.currentModelConfig };
  }

  async loadModel() {
    if (this.detector || this.isLoading) return this.detector;
    
    this.isLoading = true;
    console.log(`Carregando modelo personalizado: ${this.currentModelConfig.modelId}...`);
    
    try {
      const device = this.currentModelConfig.device === 'auto' ? 'webgpu' : this.currentModelConfig.device;
      
      this.detector = await pipeline(
        'object-detection',
        this.currentModelConfig.modelId,
        { 
          device: device
        }
      );
      console.log('Modelo personalizado carregado com sucesso!');
    } catch (error) {
      console.warn('Falha ao usar WebGPU, tentando CPU:', error);
      // Fallback para CPU se WebGPU não estiver disponível
      try {
        this.detector = await pipeline(
          'object-detection',
          this.currentModelConfig.modelId,
          { device: 'cpu' }
        );
        console.log('Modelo carregado com CPU');
      } catch (cpuError) {
        console.error('Falha ao carregar modelo personalizado:', cpuError);
        
        // Se o modelo personalizado falhar, avisar o usuário
        throw new Error(`Falha ao carregar o modelo personalizado "${this.currentModelConfig.modelId}". Verifique se o modelo existe e está acessível.`);
      }
    } finally {
      this.isLoading = false;
    }
    
    return this.detector;
  }

  async predict(imageData: string | HTMLImageElement): Promise<YOLOResult> {
    const startTime = performance.now();
    
    if (!this.detector) {
      await this.loadModel();
    }

    console.log('Executando predição com modelo personalizado...');
    
    try {
      const predictions = await this.detector(imageData, {
        threshold: this.currentModelConfig.threshold || 0.5,
        percentage: false
      });

      console.log('Predições recebidas:', predictions);

      const endTime = performance.now();
      const processingTime = `${((endTime - startTime) / 1000).toFixed(2)}s`;

      // Mapear para o formato esperado
      const formattedPredictions: YOLOPrediction[] = predictions.map((pred: any) => ({
        label: pred.label,
        score: pred.score,
        box: pred.box
      }));

      // Extrair categorias únicas
      const categories = [...new Set(formattedPredictions.map(p => p.label))];

      return {
        predictions: formattedPredictions,
        processingTime,
        modelVersion: this.currentModelConfig.modelName || this.currentModelConfig.modelId,
        categories: categories.length > 0 ? categories : ['Objetos Detectados']
      };
    } catch (error) {
      console.error('Erro na predição:', error);
      throw new Error('Falha na predição do modelo. Tente novamente.');
    }
  }

  isModelLoaded(): boolean {
    return this.detector !== null;
  }

  resetModel() {
    this.detector = null;
    console.log('Modelo resetado. Próxima predição carregará o modelo novamente.');
  }
}

export const yoloService = new YOLOService();