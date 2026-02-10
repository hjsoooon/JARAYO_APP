import React, { useState, useEffect } from 'react';
import { RecordType, FeedType, PoopType, PHRRecord } from '../types';
import { X, Camera, Droplet, Play, Pause, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import PoopScanApp from './poopscan/PoopScanApp';

interface PHRModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Partial<PHRRecord> | null; // Can be a new partial record or existing one
  mode: 'CREATE' | 'EDIT';
  onSave: (data: Partial<PHRRecord>) => void;
}

export const PHRModal: React.FC<PHRModalProps> = ({ isOpen, onClose, record, mode, onSave }) => {
  const [type, setType] = useState<RecordType | null>(null);
  const [subtype, setSubtype] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [showPoopScan, setShowPoopScan] = useState(false);
  
  // Time states
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Single Timer (generic) - kept for backward compatibility if needed, but Breast uses split
  const [timer, setTimer] = useState(0); 
  
  // Breastfeeding specific states
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerRight, setTimerRight] = useState(0);
  const [activeSide, setActiveSide] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (type === 'FEED' && subtype === 'BREAST') {
            if (activeSide === 'LEFT') setTimerLeft((prev) => prev + 1);
            else if (activeSide === 'RIGHT') setTimerRight((prev) => prev + 1);
        } else {
            setTimer((prev) => prev + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeSide, type, subtype]);

  useEffect(() => {
    if (isOpen && record) {
      setType(record.type || null);
      setSubtype(record.subtype || '');
      setValue(typeof record.value === 'string' ? record.value.replace(/[^0-9]/g, '') : '');
      setMemo(record.memo || '');
      
      // Initialize times for Edit Mode
      if (record.timestamp) {
        setStartTime(new Date(record.timestamp).toTimeString().slice(0, 5)); // HH:MM
      } else {
        setStartTime(new Date().toTimeString().slice(0, 5));
      }

      if (record.endTime) {
        setEndTime(new Date(record.endTime).toTimeString().slice(0, 5));
      } else {
        setEndTime('');
      }

      // Reset Timers
      setTimer(0);
      setTimerLeft(0);
      setTimerRight(0);
      setActiveSide(null);
      setIsTimerRunning(false);
      
      // Auto-start logic if needed, but for dual timer usually user picks a side first
      // If pure edit mode, we might not need timer, but if creating new breast feed:
    }
  }, [isOpen, record, mode]);

  if (!isOpen || !type) return null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    const data: Partial<PHRRecord> = { 
        ...record,
        type, 
        subtype, 
        memo,
    };
    
    // Handle specific values
    if (type === 'FEED') {
        if (subtype === 'BREAST') {
             // If coming from timer (CREATE mode or just using timer in modal)
             // Even in EDIT mode, if user used the timer, we might want to update value
             if (timerLeft > 0 || timerRight > 0) {
                 const totalSeconds = timerLeft + timerRight;
                 const totalMins = Math.floor(totalSeconds / 60);
                 const leftMins = Math.floor(timerLeft / 60);
                 const rightMins = Math.floor(timerRight / 60);
                 
                 data.value = `${totalMins}분`;
                 // Append detailed split to memo if not empty, or create new memo
                 const splitInfo = ` (좌: ${leftMins}분, 우: ${rightMins}분)`;
                 data.memo = memo ? memo + splitInfo : `좌: ${leftMins}분, 우: ${rightMins}분`;
             } else if (mode === 'EDIT') {
                 // Manual edit without timer
                 data.value = value ? value + '분' : undefined;
             }
        } else {
             data.value = value ? value + 'ml' : undefined;
        }
    } else if (type === 'POOP') {
        // Value might be amount/status, can use memo or generic value
    } else if (type === 'SLEEP' || type === 'BATH') {
        // Combine Date from original timestamp + Time from input
        if (record?.timestamp && startTime) {
            const d = new Date(record.timestamp);
            const [h, m] = startTime.split(':').map(Number);
            d.setHours(h, m);
            data.timestamp = d.toISOString();
        }
        if (record?.timestamp && endTime) {
            const d = new Date(record.timestamp);
            const [h, m] = endTime.split(':').map(Number);
            d.setHours(h, m);
            data.endTime = d.toISOString();
        }
    }

    onSave(data);
    onClose();
  };

  const handleEndNow = () => {
      setEndTime(new Date().toTimeString().slice(0, 5));
  };

  const toggleSide = (side: 'LEFT' | 'RIGHT') => {
      if (activeSide === side) {
          // Pause if clicking same active side
          setIsTimerRunning(!isTimerRunning);
      } else {
          // Switch side and start
          setActiveSide(side);
          setIsTimerRunning(true);
      }
  };

  const renderContent = () => {
    switch (type) {
      case 'SLEEP':
        return (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">잠든 시간</label>
                    <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-gray-50 rounded-xl p-3 font-bold text-lg outline-none focus:ring-2 ring-indigo-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">일어난 시간</label>
                    {endTime ? (
                        <input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl p-3 font-bold text-lg outline-none focus:ring-2 ring-indigo-200"
                        />
                    ) : (
                        <button 
                            onClick={handleEndNow}
                            className="w-full h-[52px] bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                        >
                            지금 기상!
                        </button>
                    )}
                </div>
             </div>
          </div>
        );
      case 'FEED':
        if (subtype === 'BREAST') {
            if (mode === 'CREATE') {
                const totalSeconds = timerLeft + timerRight;
                return (
                    <div className="py-2">
                        {/* Total Time Display */}
                        <div className="text-center mb-8">
                            <span className="text-sm text-gray-500 font-bold block mb-1">총 수유 시간</span>
                            <div className="text-5xl font-mono font-bold text-gray-800">{formatTimer(totalSeconds)}</div>
                        </div>

                        {/* Split Controls */}
                        <div className="flex justify-center items-center gap-6 mb-8">
                            {/* Left Side */}
                            <button
                                onClick={() => toggleSide('LEFT')}
                                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-lg border-4 ${
                                    activeSide === 'LEFT' && isTimerRunning 
                                    ? 'bg-orange-100 border-orange-400 text-orange-700 scale-105' 
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200'
                                }`}
                            >
                                <span className="text-lg font-bold mb-1">왼쪽</span>
                                <span className="text-2xl font-mono font-bold">{formatTimer(timerLeft)}</span>
                                {activeSide === 'LEFT' && isTimerRunning && <Pause size={20} className="mt-2 animate-pulse" />}
                                {activeSide === 'LEFT' && !isTimerRunning && <Play size={20} className="mt-2" />}
                            </button>

                            {/* Right Side */}
                            <button
                                onClick={() => toggleSide('RIGHT')}
                                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all shadow-lg border-4 ${
                                    activeSide === 'RIGHT' && isTimerRunning 
                                    ? 'bg-orange-100 border-orange-400 text-orange-700 scale-105' 
                                    : 'bg-white border-gray-100 text-gray-400 hover:border-orange-200'
                                }`}
                            >
                                <span className="text-lg font-bold mb-1">오른쪽</span>
                                <span className="text-2xl font-mono font-bold">{formatTimer(timerRight)}</span>
                                {activeSide === 'RIGHT' && isTimerRunning && <Pause size={20} className="mt-2 animate-pulse" />}
                                {activeSide === 'RIGHT' && !isTimerRunning && <Play size={20} className="mt-2" />}
                            </button>
                        </div>
                        
                        <div className="flex justify-center">
                            <button
                                onClick={() => { setIsTimerRunning(false); setActiveSide(null); handleSave(); }}
                                className="w-full bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <Square size={20} fill="currentColor" />
                                <span>수유 종료 및 저장</span>
                            </button>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div>
                         <label className="block text-sm font-bold text-gray-500 mb-2">수유 시간 (분)</label>
                         <input
                            type="number"
                            inputMode="numeric"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full text-center text-4xl font-bold py-4 border-b-2 border-gray-200 focus:border-secondary outline-none text-secondary"
                        />
                    </div>
                )
            }
        }
        return (
          <div className="space-y-6">
             <div className="flex bg-gray-100 rounded-xl p-1">
                {(['FORMULA', 'FOOD'] as FeedType[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setSubtype(t)}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        subtype === t ? 'bg-white text-secondary shadow-sm' : 'text-gray-400'
                        }`}
                    >
                        {t === 'FORMULA' ? '분유' : '이유식'}
                    </button>
                ))}
             </div>
             <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">섭취량 ({subtype === 'FOOD' ? 'g' : 'ml'})</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0"
                  className="w-full text-center text-4xl font-bold py-4 border-b-2 border-gray-200 focus:border-secondary outline-none text-secondary"
                />
             </div>
          </div>
        );
      case 'POOP':
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
               {(['PEE', 'POO'] as PoopType[]).map((t) => (
                 <button
                   key={t}
                   onClick={() => setSubtype(t)}
                   className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-1 ${
                     subtype === t 
                       ? t === 'POO' 
                         ? 'border-amber-400 bg-amber-50 text-amber-800' 
                         : 'border-yellow-500 bg-yellow-50 text-yellow-800'
                       : 'border-gray-100 bg-white text-gray-400'
                   }`}
                 >
                   <span className="text-2xl">{t === 'PEE' ? '💧' : '💩'}</span>
                   <span>{t === 'PEE' ? '소변' : '대변'}</span>
                 </button>
               ))}
            </div>
            
            {subtype === 'POO' && (
              <div className="space-y-3">
                {/* AI 푸스캔 유도 카드 */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🤖</span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">AI 추천</span>
                  </div>
                  <p className="text-sm text-amber-800 font-medium mb-1">사진을 찍으면 AI가 건강 상태를 분석해드려요!</p>
                  <p className="text-[11px] text-amber-600/70 mb-3">색상, 굳기, 양 등을 자동으로 체크합니다</p>
                  
                  <button
                    onClick={() => setShowPoopScan(true)}
                    className="relative flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-200/50 overflow-hidden active:scale-[0.97] transition-transform"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]"></div>
                    <Camera size={20} className="relative z-10" />
                    <span className="relative z-10 text-[15px]">AI 푸스캔 시작하기</span>
                    <span className="relative z-10 text-lg">📸</span>
                  </button>
                </div>

                {/* 또는 수동 기록 안내 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-[11px] text-gray-400 font-medium">또는 직접 기록</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              </div>
            )}
          </div>
        );
      case 'BATH':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">시작</label>
                    <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-gray-50 rounded-xl p-3 font-bold text-lg outline-none focus:ring-2 ring-blue-200"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">종료</label>
                    <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-gray-50 rounded-xl p-3 font-bold text-lg outline-none focus:ring-2 ring-blue-200"
                    />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">물 온도</label>
                <div className="flex gap-2">
                    <button className="flex-1 bg-blue-50 py-2 rounded-lg text-blue-400 font-bold text-sm hover:bg-blue-100">미지근</button>
                    <button className="flex-1 bg-blue-50 py-2 rounded-lg text-blue-400 font-bold text-sm hover:bg-blue-100">따뜻</button>
                </div>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pointer-events-auto animate-slide-up shadow-2xl pb-10 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">
            {type === 'FEED' ? '수유 상세' : type === 'SLEEP' ? '수면 상세' : type === 'POOP' ? '배변 상세' : '목욕 상세'}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        {renderContent()}

        {/* Hide Memo in Timer Mode (Added split info to memo automatically, but user can edit if needed, but simplified here) */}
        {!(mode === 'CREATE' && subtype === 'BREAST') && (
            <div className="mt-6">
            <label className="block text-sm font-bold text-gray-500 mb-2">메모</label>
            <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full bg-gray-50 rounded-xl p-3 resize-none text-sm outline-none focus:ring-2 ring-primary/50"
                rows={2}
                placeholder="특이사항을 적어주세요"
            />
            </div>
        )}

        {/* Hide Save Button in Timer Mode, handled by Stop button inside renderContent */}
        {!(mode === 'CREATE' && subtype === 'BREAST') && (
            <button
            onClick={handleSave}
            className="w-full mt-6 bg-primary text-yellow-900 py-4 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-transform"
            >
            저장하기
            </button>
        )}
      </div>

      {/* AI 배변 스캔 모달 */}
      {showPoopScan && (
        <div className="fixed inset-0 z-[200] bg-white">
          <PoopScanApp onClose={() => setShowPoopScan(false)} />
        </div>
      )}
    </div>
  );
};
