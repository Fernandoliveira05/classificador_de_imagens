import { useState } from 'react';
import { Settings, Brain, Upload, Server, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { yoloService, CustomModelConfig } from '@/services/yoloService';
import { localYoloService, LocalModelConfig } from '@/services/localYoloService';

const ModelConfigDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('huggingface');
  const [hfConfig, setHfConfig] = useState<CustomModelConfig>(yoloService.getCurrentModelConfig());
  const [localConfig, setLocalConfig] = useState<LocalModelConfig>(localYoloService.getConfig());
  const [testingConnection, setTestingConnection] = useState(false);

  const handleSave = () => {
    try {
      if (activeTab === 'huggingface') {
        yoloService.setCustomModel(hfConfig);
        toast.success('Configuração do modelo Hugging Face salva!');
      } else {
        localYoloService.setConfig(localConfig);
        toast.success('Configuração do modelo local salva!');
      }
      setIsOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar configuração do modelo');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const isConnected = await localYoloService.testConnection();
      if (isConnected) {
        toast.success('Conexão com servidor local bem-sucedida!');
      } else {
        toast.error('Falha ao conectar com servidor local. Verifique se está rodando na porta 8000.');
      }
    } catch (error) {
      toast.error('Erro ao testar conexão');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetHF = () => {
    const defaultConfig: CustomModelConfig = {
      modelId: 'Xenova/detr-resnet-50',
      threshold: 0.5,
      device: 'auto',
      modelName: 'DETR ResNet-50 (Padrão)'
    };
    setHfConfig(defaultConfig);
  };

  const handleResetLocal = () => {
    const defaultConfig: LocalModelConfig = {
      threshold: 0.5,
      device: 'cpu',
      modelName: 'Modelo Local YOLO',
      serverUrl: 'http://localhost:8000'
    };
    setLocalConfig(defaultConfig);
  };

  const presetModels = [
    {
      id: 'Xenova/detr-resnet-50',
      name: 'DETR ResNet-50 (Padrão)',
      description: 'Modelo base para detecção de objetos'
    },
    {
      id: 'Xenova/yolov9-c',
      name: 'YOLOv9-C',
      description: 'YOLOv9 otimizado (se disponível)'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configurar Modelo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configuração do Modelo YOLO
          </DialogTitle>
          <DialogDescription>
            Configure seu modelo YOLO - use modelos do Hugging Face ou rode seu próprio modelo .pt localmente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="huggingface" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Hugging Face
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Modelo Local (.pt)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="huggingface" className="space-y-6">
            {/* Modelo Personalizado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Modelo Personalizado
                </CardTitle>
                <CardDescription>
                  Use seu próprio modelo treinado hospedado no Hugging Face Hub
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelId">ID do Modelo</Label>
                  <Input
                    id="modelId"
                    placeholder="ex: seu-usuario/seu-modelo-yolo"
                    value={hfConfig.modelId}
                    onChange={(e) => setHfConfig({ ...hfConfig, modelId: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    Digite o ID do seu modelo no Hugging Face Hub (formato: usuario/modelo)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelName">Nome para Exibição</Label>
                  <Input
                    id="modelName"
                    placeholder="ex: Meu Modelo YOLO v1.0"
                    value={hfConfig.modelName || ''}
                    onChange={(e) => setHfConfig({ ...hfConfig, modelName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Limite de Confiança</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={hfConfig.threshold || 0.5}
                      onChange={(e) => setHfConfig({ ...hfConfig, threshold: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device">Dispositivo</Label>
                    <Select value={hfConfig.device} onValueChange={(value: 'webgpu' | 'cpu' | 'auto') => setHfConfig({ ...hfConfig, device: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Automático</SelectItem>
                        <SelectItem value="webgpu">WebGPU</SelectItem>
                        <SelectItem value="cpu">CPU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modelos Pré-definidos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modelos Pré-definidos</CardTitle>
                <CardDescription>
                  Escolha um modelo pré-treinado disponível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {presetModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setHfConfig({
                        ...hfConfig,
                        modelId: model.id,
                        modelName: model.name
                      })}
                      className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                        hfConfig.modelId === model.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="local" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Servidor Local Python
                </CardTitle>
                <CardDescription>
                  Configure a conexão com seu servidor Python local rodando o modelo .pt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serverUrl">URL do Servidor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="serverUrl"
                      placeholder="http://localhost:8000"
                      value={localConfig.serverUrl || ''}
                      onChange={(e) => setLocalConfig({ ...localConfig, serverUrl: e.target.value })}
                    />
                    <Button 
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      variant="outline"
                      size="sm"
                    >
                      {testingConnection ? 'Testando...' : 'Testar'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    URL onde seu servidor Python está rodando (padrão: http://localhost:8000)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localModelName">Nome do Modelo</Label>
                  <Input
                    id="localModelName"
                    placeholder="ex: Meu YOLO Personalizado v1.0"
                    value={localConfig.modelName || ''}
                    onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="localThreshold">Limite de Confiança</Label>
                    <Input
                      id="localThreshold"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localConfig.threshold || 0.5}
                      onChange={(e) => setLocalConfig({ ...localConfig, threshold: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localDevice">Dispositivo</Label>
                    <Select value={localConfig.device} onValueChange={(value: 'cpu' | 'gpu') => setLocalConfig({ ...localConfig, device: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpu">CPU</SelectItem>
                        <SelectItem value="gpu">GPU (CUDA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Instruções de Setup:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Instale: <code className="bg-blue-100 px-1 rounded">pip install fastapi uvicorn torch ultralytics</code></li>
                    <li>2. Use o arquivo python_server_example.py como base</li>
                    <li>3. Substitua o caminho do modelo pelo seu arquivo .pt</li>
                    <li>4. Execute: <code className="bg-blue-100 px-1 rounded">python python_server_example.py</code></li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={activeTab === 'huggingface' ? handleResetHF : handleResetLocal}
          >
            Resetar Padrão
          </Button>
          <Button onClick={handleSave}>
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelConfigDialog;