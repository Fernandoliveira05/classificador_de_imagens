import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Brain, Zap, Eye, Target } from 'lucide-react';
import SimpleButton from '@/components/SimpleButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import WebcamCapture from '@/components/WebcamCapture';
import ImageUpload from '@/components/ImageUpload';
import ClassificationResult from '@/components/ClassificationResult';
import ImageWithBoundingBoxes from '@/components/ImageWithBoundingBoxes';
import Header from '@/components/Header';
import { yoloService, YOLOResult } from '@/services/yoloService';
import { localYoloService } from '@/services/localYoloService';
import ModelConfigDialog from '@/components/ModelConfigDialog';

const Index = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<YOLOResult | null>(null);
  const [activeMode, setActiveMode] = useState<'upload' | 'webcam'>('upload');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelType, setModelType] = useState<'huggingface' | 'local'>('huggingface');

  const handleImageCapture = useCallback((imageData: string) => {
    setCurrentImage(imageData);
    setClassificationResult(null);
    toast.success('Imagem capturada com sucesso!');
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCurrentImage(result);
      setClassificationResult(null);
      toast.success('Imagem carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  }, []);

  const runYOLOClassification = useCallback(async () => {
    if (!currentImage) {
      toast.error('Por favor, capture ou carregue uma imagem primeiro');
      return;
    }

    setIsClassifying(true);
    
    try {
      let result: YOLOResult;

      if (modelType === 'local') {
        // Usar modelo local
        toast.info('Enviando para servidor local...');
        const localResult = await localYoloService.predict(currentImage);
        
        // Converter para formato compatível
        result = {
          predictions: localResult.predictions.map(pred => ({
            label: pred.label,
            score: pred.score,
            box: pred.box
          })),
          processingTime: localResult.processingTime,
          modelVersion: localResult.modelVersion,
          categories: localResult.categories
        };
      } else {
        // Usar modelo Hugging Face
        if (!yoloService.isModelLoaded()) {
          setIsModelLoading(true);
          const modelConfig = yoloService.getCurrentModelConfig();
          toast.info(`Carregando modelo: ${modelConfig.modelName || modelConfig.modelId}...`);
          await yoloService.loadModel();
          setIsModelLoading(false);
          toast.success('Modelo carregado com sucesso!');
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        result = await new Promise<YOLOResult>((resolve, reject) => {
          img.onload = async () => {
            try {
              const prediction = await yoloService.predict(img);
              resolve(prediction);
            } catch (error) {
              reject(error);
            }
          };
          img.onerror = () => reject(new Error('Falha ao carregar imagem'));
          img.src = currentImage;
        });
      }
      
      setClassificationResult(result);
      
      if (result.predictions.length > 0) {
        toast.success(`Detectados ${result.predictions.length} objetos!`);
      } else {
        toast.info('Nenhum objeto detectado na imagem');
      }
    } catch (error) {
      console.error('Erro na classificação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar a imagem. Tente novamente.');
    } finally {
      setIsClassifying(false);
      setIsModelLoading(false);
    }
  }, [currentImage, modelType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Brain className="h-4 w-4" />
            YOLO Customizável - Modelos Web e Locais
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Detector de Objetos YOLO
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Use modelos do Hugging Face ou rode seu próprio modelo .pt localmente
          </p>
          
          {/* Configuração e Seleção de Modelo */}
          <div className="flex justify-center gap-4 items-center flex-wrap">
            <ModelConfigDialog />
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Tipo de Modelo:</label>
              <select 
                value={modelType} 
                onChange={(e) => setModelType(e.target.value as 'huggingface' | 'local')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="huggingface">Hugging Face</option>
                <option value="local">Local (.pt)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center gap-4 mb-8">
          <SimpleButton
            variant={activeMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setActiveMode('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload de Arquivo
          </SimpleButton>
          <SimpleButton
            variant={activeMode === 'webcam' ? 'default' : 'outline'}
            onClick={() => setActiveMode('webcam')}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Webcam
          </SimpleButton>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {activeMode === 'webcam' ? (
                    <>
                      <Camera className="h-5 w-5 text-blue-600" />
                      Captura por Webcam
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-purple-600" />
                      Upload de Imagem
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeMode === 'webcam' ? (
                  <WebcamCapture onImageCapture={handleImageCapture} />
                ) : (
                  <ImageUpload onImageUpload={handleImageUpload} />
                )}
              </CardContent>
            </Card>

            {/* Classification Button */}
            {currentImage && (
              <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <SimpleButton
                    onClick={runYOLOClassification}
                    disabled={isClassifying || isModelLoading}
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                    size="lg"
                  >
                    {isModelLoading ? (
                      <>
                        <Brain className="h-5 w-5 mr-2 animate-pulse" />
                        Carregando Modelo...
                      </>
                    ) : isClassifying ? (
                      <>
                        <Zap className="h-5 w-5 mr-2 animate-pulse" />
                        {modelType === 'local' ? 'Processando Localmente...' : 'Detectando Objetos...'}
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5 mr-2" />
                        Detectar Objetos ({modelType === 'local' ? 'Local' : 'HF'})
                      </>
                    )}
                  </SimpleButton>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {currentImage && (
              <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    Imagem e Detecções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {classificationResult && classificationResult.predictions.length > 0 ? (
                    <ImageWithBoundingBoxes 
                      imageUrl={currentImage}
                      predictions={classificationResult.predictions}
                    />
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={currentImage}
                        alt="Imagem para detecção"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {classificationResult && (
              <ClassificationResult result={classificationResult} />
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Captura por Webcam</h3>
              <p className="text-sm text-gray-600">
                Capture imagens diretamente da sua webcam para classificação instantânea
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Modelos Flexíveis</h3>
              <p className="text-sm text-gray-600">
                Use modelos do Hugging Face ou rode seu próprio modelo .pt localmente
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Alta Precisão</h3>
              <p className="text-sm text-gray-600">
                Detecção precisa com bounding boxes e scores de confiança personalizáveis
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;