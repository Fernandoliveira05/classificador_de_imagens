import { useState, useRef, useCallback } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import SimpleButton from './SimpleButton';
import { toast } from 'sonner';

interface WebcamCaptureProps {
  onImageCapture: (imageData: string) => void;
}

const WebcamCapture = ({ onImageCapture }: WebcamCaptureProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setStream(mediaStream);
      setIsStreaming(true);
      toast.success('Webcam ativada com sucesso!');
    } catch (error) {
      console.error('Erro ao acessar a webcam:', error);
      toast.error(`Erro: ${(error as Error).message}`);
    }

  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsStreaming(false);
    toast.info('Webcam desativada');
  }, [stream]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onImageCapture(imageData);
        stopCamera();
      }
    }
  }, [onImageCapture, stopCamera]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
        {isStreaming ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Webcam Desativada</p>
              <p className="text-sm">Clique em "Ativar Webcam" para começar</p>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-3 justify-center">
        {!isStreaming ? (
          <SimpleButton onClick={startCamera} className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Ativar Webcam
          </SimpleButton>
        ) : (
          <>
            <SimpleButton onClick={captureImage} className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Capturar Foto
            </SimpleButton>
            <SimpleButton variant="outline" onClick={stopCamera} className="flex items-center gap-2">
              <CameraOff className="h-4 w-4" />
              Desativar
            </SimpleButton>
          </>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
