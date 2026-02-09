import React from 'react';
import { Home, BookOpen, MessageCircle, BarChart2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'diary', icon: BookOpen, label: '일기' },
    { id: 'chat', icon: MessageCircle, label: 'AI 코치' },
    { id: 'report', icon: BarChart2, label: '리포트' },
  ];

  return (
    <div className="flex flex-col h-screen bg-cream max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </main>
      
      {/* Standard Fixed Bottom Navigation Bar */}
      <nav className="bg-white border-t border-gray-100 flex items-center justify-around py-3 px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 flex-1 py-1 transition-all active:scale-90"
            >
              <Icon 
                size={22} 
                className={`transition-colors duration-300 ${isActive ? 'text-secondary' : 'text-gray-300'}`} 
              />
              <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? 'text-secondary' : 'text-gray-300'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};