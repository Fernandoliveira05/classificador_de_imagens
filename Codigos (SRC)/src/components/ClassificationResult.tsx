
import { Target, Clock, Cpu, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { YOLOResult } from '@/services/yoloService';

interface ClassificationResultProps {
  result: YOLOResult;
}

const ClassificationResult = ({ result }: ClassificationResultProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-blue-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resultados da Detecção YOLO
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{result.predictions.length}</div>
              <div className="text-sm opacity-90">Objetos Detectados</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{result.processingTime}</div>
              <div className="text-sm opacity-90">Tempo de Processo</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{result.modelVersion.split(' ')[0]}</div>
              <div className="text-sm opacity-90">Modelo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            Detecções
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.predictions.length > 0 ? (
            result.predictions.map((prediction, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm font-medium">
                      #{index + 1}
                    </Badge>
                    <span className="font-semibold text-lg">{prediction.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Confiança</div>
                    <div className="font-bold text-lg">
                      {(prediction.score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Nível de confiança: {getConfidenceText(prediction.score)}</span>
                    <span className="text-gray-500">
                      {(prediction.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={prediction.score * 100} 
                    className="h-2"
                  />
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Bounding Box: [{Math.round(prediction.box.xmin)}, {Math.round(prediction.box.ymin)}, {Math.round(prediction.box.xmax)}, {Math.round(prediction.box.ymax)}]
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum objeto detectado nesta imagem</p>
              <p className="text-sm">Tente com uma imagem que contenha objetos, pessoas ou animais</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Info */}
      <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            Informações do Modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Versão do Modelo</div>
              <div className="text-gray-600">{result.modelVersion}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Tempo de Processamento</div>
              <div className="text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {result.processingTime}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="font-medium text-gray-700 mb-2">Categorias Detectadas</div>
            <div className="flex flex-wrap gap-2">
              {result.categories.map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassificationResult;