
import { Brain, Github, Book } from 'lucide-react';
import SimpleButton from './SimpleButton';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">YOLO Classifier</h1>
              <p className="text-sm text-gray-500">Visão Computacional Avançada</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SimpleButton variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
              <Book className="h-4 w-4" />
              Documentação
            </SimpleButton>
            <SimpleButton variant="ghost" size="sm" className="hidden md:flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </SimpleButton>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
