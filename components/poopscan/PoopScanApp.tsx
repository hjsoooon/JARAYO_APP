import React, { useState, useEffect, useCallback } from 'react';
import { PoopScanState, PoopAnalysisResult, PoopHistoryItem } from '../../types';
import { analyzePoopImage } from '../../services/poopscan/geminiService';
import { saveToHistory, getHistory } from '../../services/poopscan/historyStorage';
import CameraView from './CameraView';
import ResultView from './ResultView';
import HistoryView from './HistoryView';

interface PoopScanAppProps {
  onClose?: () => void;
}

const PoopScanApp: React.FC<PoopScanAppProps> = ({ onClose }) => {
  const [state, setState] = useState<PoopScanState>(() => ({
    view: 'camera',
    capturedImage: null,
    analysis: null,
  }));
  
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [history, setHistory] = useState<PoopHistoryItem[]>(() => getHistory());
  
  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const handlePermissionChange = useCallback((hasPermission: boolean | null) => {
    setCameraPermission(hasPermission);
  }, []);

  const handleCapture = async (imageData: string) => {
    setState(prev => ({ ...prev, view: 'analyzing', capturedImage: imageData }));
    
    try {
      const result = await analyzePoopImage(imageData);
      saveToHistory(imageData, result);
      refreshHistory();
      setState(prev => ({ 
        ...prev, 
        view: 'result', 
        analysis: result 
      }));
    } catch (error) {
      console.error("Analysis Failed", error);
      alert("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setState(prev => ({ ...prev, view: 'camera' }));
    }
  };

  const handleReset = () => {
    setState({
      view: 'camera',
      capturedImage: null,
      analysis: null,
    });
  };

  const handleShowHistory = useCallback(() => {
    refreshHistory();
    setState(prev => ({ ...prev, view: 'history' }));
  }, [refreshHistory]);

  const handleSelectHistoryItem = useCallback((item: PoopHistoryItem) => {
    setState({
      view: 'result',
      capturedImage: item.image,
      analysis: item.analysis,
    });
  }, []);

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-[60] w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-amber-600 hover:bg-white transition-colors"
          style={{ top: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}

      {state.view === 'camera' && (
        <CameraView 
          onCapture={handleCapture} 
          isProcessing={false}
          onPermissionChange={handlePermissionChange}
          onShowHistory={handleShowHistory}
          historyCount={history.length}
        />
      )}
      
      {state.view === 'analyzing' && (
        <CameraView 
          onCapture={() => {}} 
          isProcessing={true} 
          capturedImage={state.capturedImage}
        />
      )}

      {state.view === 'result' && state.capturedImage && state.analysis && (
        <div className="overflow-y-auto h-full">
          <ResultView 
            image={state.capturedImage} 
            analysis={state.analysis} 
            onReset={handleReset} 
          />
        </div>
      )}

      {state.view === 'history' && (
        <HistoryView
          history={history}
          onBack={handleReset}
          onSelectItem={handleSelectHistoryItem}
          onHistoryChange={refreshHistory}
        />
      )}
    </div>
  );
};

export default PoopScanApp;
