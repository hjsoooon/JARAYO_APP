import React from 'react';
import { Loader2 } from 'lucide-react';

export const ChatTab: React.FC = () => {
  const [loading, setLoading] = React.useState(true);

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="p-4 border-b border-gray-100 flex items-center justify-center">
        <h1 className="font-bold text-lg text-gray-800">AI 육아 코치</h1>
      </header>
      <div className="flex-1 relative bg-gray-50">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
             <Loader2 className="animate-spin mb-2" size={32} />
             <span className="text-sm">코치님을 불러오고 있어요...</span>
          </div>
        )}
        <iframe 
          src="https://hjsoooon.github.io/Jarayo/" 
          title="Jarayo AI Chat"
          className="w-full h-full border-0 relative z-10"
          onLoad={() => setLoading(false)}
        />
      </div>
      {/* Spacer for bottom nav */}
      <div className="h-20 bg-white"></div>
    </div>
  );
};
