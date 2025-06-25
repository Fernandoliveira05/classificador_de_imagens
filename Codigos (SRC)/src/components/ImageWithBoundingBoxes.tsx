
import { useRef, useEffect, useState } from 'react';
import { YOLOPrediction } from '@/services/yoloService';

interface ImageWithBoundingBoxesProps {
  imageUrl: string;
  predictions: YOLOPrediction[];
  className?: string;
}

const ImageWithBoundingBoxes = ({ imageUrl, predictions, className = '' }: ImageWithBoundingBoxesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const drawBoundingBoxes = () => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      
      if (!canvas || !image || predictions.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Ajustar o canvas para o tamanho da imagem
      canvas.width = image.offsetWidth;
      canvas.height = image.offsetHeight;

      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calcular escala
      const scaleX = image.offsetWidth / image.naturalWidth;
      const scaleY = image.offsetHeight / image.naturalHeight;

      // Desenhar bounding boxes
      predictions.forEach((prediction, index) => {
        const { box, label, score } = prediction;
        
        // Converter coordenadas
        const x = box.xmin * scaleX;
        const y = box.ymin * scaleY;
        const width = (box.xmax - box.xmin) * scaleX;
        const height = (box.ymax - box.ymin) * scaleY;

        // Cores diferentes para cada predição
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
        const color = colors[index % colors.length];

        // Desenhar caixa
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);

        // Desenhar fundo do label
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.8;
        const labelText = `${label} (${(score * 100).toFixed(1)}%)`;
        const textMetrics = ctx.measureText(labelText);
        const labelHeight = 20;
        ctx.fillRect(x, y - labelHeight, textMetrics.width + 10, labelHeight);

        // Desenhar texto
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 1;
        ctx.font = '12px Arial';
        ctx.fillText(labelText, x + 5, y - 5);
      });
    };

    drawBoundingBoxes();
  }, [predictions, imageDimensions]);

  const handleImageLoad = () => {
    const image = imageRef.current;
    if (image) {
      setImageDimensions({
        width: image.offsetWidth,
        height: image.offsetHeight
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Imagem com detecções"
        className="w-full h-64 object-cover rounded-lg"
        onLoad={handleImageLoad}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-lg"
      />
    </div>
  );
};

export default ImageWithBoundingBoxes;