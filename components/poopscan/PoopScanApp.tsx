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
    console.log('🎯 handleCapture 시작');
    setState(prev => ({ ...prev, view: 'analyzing', capturedImage: imageData }));
    
    try {
      console.log('🔄 분석 시작...');
      const result = await analyzePoopImage(imageData);
      console.log('✅ 분석 완료:', result);
      
      // 히스토리 저장 (실패해도 결과 표시에 영향 없음)
      try {
        saveToHistory(imageData, result);
        refreshHistory();
      } catch (historyError) {
        console.warn("History save failed:", historyError);
      }
      
      const newState = {
        view: 'result' as const, 
        capturedImage: imageData,
        analysis: result 
      };
      console.log('📊 새로운 state로 전환:', newState);
      setState(newState);
    } catch (error) {
      console.error("❌ Analysis Failed", error);
      alert("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setState({ view: 'camera', capturedImage: null, analysis: null });
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

  console.log('🖼️ 현재 state:', state);

  return (
    <div className="w-full h-full bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-amber-600 hover:bg-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}

      {state.view === 'camera' && (
        <div className="flex-1 min-h-0 relative">
          <CameraView 
            onCapture={handleCapture} 
            isProcessing={false}
            onPermissionChange={handlePermissionChange}
            onShowHistory={handleShowHistory}
            historyCount={history.length}
          />
        </div>
      )}
      
      {state.view === 'analyzing' && (
        <div className="flex-1 min-h-0 relative">
          <CameraView 
            onCapture={() => {}} 
            isProcessing={true} 
            capturedImage={state.capturedImage}
          />
        </div>
      )}

      {state.view === 'result' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {state.capturedImage && state.analysis ? (
            <ResultView 
              image={state.capturedImage} 
              analysis={state.analysis} 
              onReset={handleReset} 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">결과를 불러오는 중...</p>
            </div>
          )}
        </div>
      )}

      {state.view === 'history' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <HistoryView
            history={history}
            onBack={handleReset}
            onSelectItem={handleSelectHistoryItem}
            onHistoryChange={refreshHistory}
          />
        </div>
      )}
    </div>
  );
};

export default PoopScanApp;
