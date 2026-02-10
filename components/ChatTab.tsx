import React, { useState, useEffect, useRef, useCallback } from 'react';
import { COACHES, ILLUSTRATION_CARDS, COACH_TO_CATEGORY } from '../constants';
import { Message, CoachRole, ChecklistItem, InsightReport } from '../types';
import { getGeminiResponse } from '../services/geminiService_coach';

const ConfettiEffect = () => (
  <div className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center animate-celebration">
    {/* 배경 오버레이 */}
    <div className="absolute inset-0 bg-black/10"></div>
    
    {/* 축하 컨텐츠 */}
    <div className="relative flex flex-col items-center gap-3">
      {/* 메인 이모지 */}
      <div className="text-6xl animate-bounce-gentle">🎉</div>
      
      {/* 메시지 */}
      <p className="text-[18px] font-black text-gray-700">완료!</p>
      
      {/* 주변 파티클 */}
      <div className="absolute -top-4 -left-8 text-2xl animate-float-1">✨</div>
      <div className="absolute -top-2 right-[-30px] text-xl animate-float-2">⭐</div>
      <div className="absolute bottom-0 -left-10 text-lg animate-float-3">🌟</div>
      <div className="absolute bottom-2 right-[-35px] text-xl animate-float-1">💫</div>
    </div>
  </div>
);

export const ChatTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHATS' | 'INSIGHTS'>('CHATS');
  const [forcedCoachId, setForcedCoachId] = useState<CoachRole | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<{
    title: string;
    description: string;
    emoji: string;
    gradient: string;
    category: string;
    tips?: string[];
    fullGuide?: {
      intro: string;
      steps: { icon: string; title: string; desc: string; }[];
      tips: string[];
      relatedQuestion: string;
    };
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const insightsContainerRef = useRef<HTMLDivElement>(null);

  const dateReviver = (key: string, value: any) => {
    if (key === 'timestamp' && typeof value === 'string') return new Date(value);
    return value;
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('jarayo_coach_messages_v1');
    return saved ? JSON.parse(saved, dateReviver) : [];
  });

  // 체크리스트 완료 상태 저장
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('jarayo_coach_checklist_completed');
    return saved ? JSON.parse(saved) : {};
  });

  // 체크리스트에 적합하지 않은 title (필터링용)
  const SKIP_CHECKLIST_TITLES = new Set([
    '수면 코치 전문 분야', '영양 코치 전문 분야', '심리 코치 전문 분야', 
    '발달 코치 전문 분야', '배변 코치 전문 분야', '이런 걸 물어보세요',
    '5명의 전문 코치', '24시간 상담 가능', '맞춤형 육아 가이드',
    '이렇게 질문해보세요', '월령별 맞춤 조언', '발달 이정표 확인',
    '구체적일수록 좋아요', '이런 질문을 해보세요', '함께해요',
    '자유롭게 대화하세요', '구체적으로 말해주세요'
  ]);

  // 특정 title을 자연스러운 체크리스트 텍스트로 변환하는 매핑
  const CHECKLIST_TEXT_MAP: Record<string, string> = {
    // 수면
    '수면 의식 3단계 루틴': '수면 의식 루틴 실천하기',
    '백색소음 활용 팁': '백색소음 틀어주기',
    '드림피딩 시도하기': '드림피딩 시도해보기',
    '최적의 수면 환경': '수면 환경 점검하기',
    '페이드아웃 기법': '페이드아웃 기법 시도하기',
    '애착 물건 활용': '애착 물건 곁에 두기',
    
    // 영양/이유식
    '초기 이유식 시작법': '초기 이유식 시작하기',
    '3일 규칙 지키기': '새 식재료 3일 규칙 지키기',
    '즐거운 식사 환경': '즐거운 식사 분위기 만들기',
    '다양한 질감 시도': '다양한 질감의 음식 시도하기',
    '철분 섭취 필수': '철분 음식 챙겨주기',
    '영양 균형 1:1:1': '탄수화물:단백질:채소 1:1:1 맞추기',
    
    // 심리
    '감정 코칭 3단계': '감정 코칭 3단계 적용하기',
    '안아주기의 힘': '아이 많이 안아주기',
    '이별 의식 만들기': '짧은 이별 인사 만들기',
    '점진적 분리 연습': '분리 시간 조금씩 늘리기',
    '눈 맞춤의 마법': '아이와 눈 맞추기',
    '목소리로 교감하기': '아이 옹알이에 대답해주기',
    
    // 발달
    '발달은 개인차가 있어요': '발달 개인차 이해하기',
    '매일 10분 놀이 자극': '매일 10분 아이와 놀아주기',
    '터미타임 가이드': '터미타임 해주기',
    '흥미 유발 장난감': '터미타임용 장난감 준비하기',
    '손가락 놀이 추천': '손가락 놀이 해주기',
    '감각 놀이 중요': '다양한 감각 놀이 시도하기',
    
    // 배변
    '배변 훈련 준비 신호': '배변 훈련 준비 신호 확인하기',
    '유아 변기 친해지기': '유아 변기에 앉아보기',
    '수분 섭취 늘리기': '물/과일즙 자주 주기',
    '배 마사지 방법': '배 마사지 해주기',
    '인형 놀이 활용': '인형으로 변기 놀이하기',
    '작은 보상 시스템': '변기 성공 시 스티커 주기',
  };

  // title이 체크리스트에 적합한지 확인
  const isValidForChecklist = (title: string): boolean => {
    const text = title.replace(/[!?]$/, '').trim();
    return !SKIP_CHECKLIST_TITLES.has(text);
  };

  // title을 "~하기" 형식의 간결한 체크리스트 텍스트로 변환
  const toChecklistText = (title: string): string => {
    const text = title
      .replace(/[!?]$/, '')
      .replace(/\s*=\s*.+$/, '')
      .replace(/\s*\(.+\)$/, '')
      .trim();
    
    if (CHECKLIST_TEXT_MAP[text]) {
      return CHECKLIST_TEXT_MAP[text];
    }
    
    if (text.endsWith('하기') || text.endsWith('주기') || text.endsWith('보기')) {
      return text;
    }
    
    const suffixMap: [string, string][] = [
      ['가이드', ' 따라하기'],
      ['팁', ' 따라하기'],
      ['방법', ' 따라하기'],
      ['루틴', ' 적용하기'],
      ['기법', ' 시도하기'],
    ];
    
    for (const [suffix, action] of suffixMap) {
      if (text.endsWith(suffix)) {
        return text + action;
      }
    }
    
    if (text.length <= 10) {
      return text + ' 실천하기';
    }
    
    return '오늘의 팁 실천하기';
  };

  // 채팅에서 추출한 동적 체크리스트 생성
  const dynamicChecklist = React.useMemo(() => {
    const allTips = messages
      .filter(m => m.role === 'assistant' && m.tips && m.tips.length > 0)
      .flatMap(m => m.tips || [])
      .filter(tip => tip.type === 'SUCCESS')
      .filter(tip => isValidForChecklist(tip.title));
    
    const uniqueTips = allTips.reduce((acc, tip) => {
      acc.set(tip.title, tip);
      return acc;
    }, new Map());
    
    const tipsFromChat = Array.from(uniqueTips.values())
      .slice(-6)
      .map((tip) => ({
        id: `tip-${tip.title.replace(/\s/g, '-')}`,
        text: toChecklistText(tip.title),
        description: '',
        completed: completedChecklist[`tip-${tip.title.replace(/\s/g, '-')}`] || false,
        category: tip.category || 'GENERAL',
        icon: tip.icon
      }));
    
    if (tipsFromChat.length === 0) {
      return [
        { id: 'default-1', text: 'AI 코치에게 첫 질문하기', description: '육아 고민을 물어보세요!', completed: completedChecklist['default-1'] || false, category: 'GENERAL', icon: '💬' },
        { id: 'default-2', text: '수면 루틴 상담받기', description: '아이 수면 패턴을 체크해보세요', completed: completedChecklist['default-2'] || false, category: 'SLEEP', icon: '😴' },
        { id: 'default-3', text: '이유식 시기 확인하기', description: '영양 코치에게 물어보세요', completed: completedChecklist['default-3'] || false, category: 'NUTRITION', icon: '🥣' }
      ];
    }
    
    return tipsFromChat;
  }, [messages, completedChecklist]);

  useEffect(() => {
    localStorage.setItem('jarayo_coach_messages_v1', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'CHATS') {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, activeTab]);

  useEffect(() => {
    if (activeTab === 'INSIGHTS' && insightsContainerRef.current) {
      insightsContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    
    try {
      const response = await getGeminiResponse(messages, textToSend, forcedCoachId || undefined);
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: response.text, 
        coachId: response.selectedCoachId,
        timestamp: new Date(),
        tips: response.tips
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsTyping(false); 
    }
  };

  const toggleChecklist = (id: string) => {
    const newCompleted = !completedChecklist[id];
    if (newCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    const updated = { ...completedChecklist, [id]: newCompleted };
    setCompletedChecklist(updated);
    localStorage.setItem('jarayo_coach_checklist_completed', JSON.stringify(updated));
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAF7]">
      {showConfetti && <ConfettiEffect />}
      
      {/* 가이드 상세 보기 모달 */}
      {selectedGuide && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedGuide(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-[32px] shadow-2xl overflow-hidden max-h-[70vh] flex flex-col mb-0" style={{ marginTop: 'env(safe-area-inset-top, 20px)', animation: 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards' }}>
            {/* 드래그 핸들 */}
            <div className="flex justify-center pt-3 pb-1 bg-white shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>
            
            {/* 헤더 */}
            <div className="relative px-5 pt-2 pb-4 bg-white shrink-0 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedGuide.gradient} flex items-center justify-center text-3xl shadow-lg shrink-0`}>
                  {selectedGuide.emoji}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold mb-1.5 ${
                    selectedGuide.category === 'SLEEP' ? 'bg-indigo-50 text-indigo-600' : 
                    selectedGuide.category === 'NUTRITION' ? 'bg-teal-50 text-teal-600' : 
                    selectedGuide.category === 'PSYCHOLOGY' ? 'bg-pink-50 text-pink-600' : 
                    selectedGuide.category === 'DEVELOPMENT' ? 'bg-green-50 text-green-600' : 
                    selectedGuide.category === 'POOP' ? 'bg-amber-50 text-amber-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {selectedGuide.category === 'SLEEP' ? '💤 수면 가이드' : 
                     selectedGuide.category === 'NUTRITION' ? '🥣 영양 가이드' : 
                     selectedGuide.category === 'PSYCHOLOGY' ? '🧠 심리 가이드' : 
                     selectedGuide.category === 'DEVELOPMENT' ? '🌱 발달 가이드' : 
                     selectedGuide.category === 'POOP' ? '🚽 배변 가이드' : '💡 육아 팁'}
                  </span>
                  <h2 className="text-[16px] font-black text-[#222] leading-tight">{selectedGuide.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedGuide(null)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-400 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <div className="p-5 pb-6">
                {selectedGuide.fullGuide ? (
                  <>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-5 bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                      {selectedGuide.fullGuide.intro}
                    </p>
                    
                    <div className="mb-5">
                      <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-3">📋 실천 가이드</h3>
                      <div className="space-y-2.5">
                        {selectedGuide.fullGuide.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-lg shrink-0">
                              {step.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-bold text-[#333] mb-0.5">{step.title}</h4>
                              <p className="text-[11px] text-gray-500 leading-snug">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-3">💡 꿀팁</h3>
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-xl border border-amber-100">
                        <ul className="space-y-1.5">
                          {selectedGuide.fullGuide.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const question = selectedGuide.fullGuide?.relatedQuestion || '';
                        setSelectedGuide(null);
                        setActiveTab('CHATS');
                        setTimeout(() => handleSendMessage(question), 150);
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-[#F5B041] to-[#E67E22] text-white font-bold text-[13px] rounded-xl shadow-lg shadow-amber-200/50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      "{selectedGuide.fullGuide.relatedQuestion}" 질문하기
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] text-gray-600 leading-relaxed mb-4">{selectedGuide.description}</p>
                    <div className="space-y-2 mb-5">
                      {selectedGuide.tips?.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                          <span className="text-base">{i === 0 ? '✅' : '💡'}</span>
                          <p className="text-[12px] text-gray-700 leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSelectedGuide(null);
                        setActiveTab('CHATS');
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-[#F5B041] to-[#E67E22] text-white font-bold text-[13px] rounded-xl shadow-lg shadow-amber-200/50 active:scale-[0.98] transition-transform"
                    >
                      AI 코치에게 더 물어보기 →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 (공통) */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-800">AI 코치</h1>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {COACHES.slice(0, 3).map(c => (
                <div key={c.id} className="w-5 h-5 rounded-full border-[1.5px] border-white flex items-center justify-center text-[8px]" style={{ background: c.bgColor }}>{c.avatar}</div>
              ))}
            </div>
            <div className="bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-green-600">온라인</span>
            </div>
          </div>
        </div>
        
        {/* 탭 전환 (세그먼트 컨트롤) */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('CHATS')} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'CHATS' 
                ? 'bg-white text-amber-500 shadow-sm' 
                : 'text-gray-400'
            }`}
          >
            💬 상담
          </button>
          <button 
            onClick={() => setActiveTab('INSIGHTS')} 
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'INSIGHTS' 
                ? 'bg-white text-amber-500 shadow-sm' 
                : 'text-gray-400'
            }`}
          >
            📊 리포트
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'CHATS' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden chat-container w-full">

            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar px-4 py-4 space-y-4 flex flex-col w-full">
              {messages.length === 0 && (
                <div className="flex flex-col items-center py-8 bubble-pop">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl border border-gray-50">👶</div>
                  </div>
                  <h2 className="text-[17px] font-black text-[#333] mb-1 text-center">무엇이든 물어보세요!</h2>
                  <p className="text-[13px] text-[#888] text-center mb-6">AI 육아코치가 24시간 답변해드려요</p>
                  
                  <div className="w-full space-y-2">
                    {COACHES.slice(0, 3).map((coach, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSendMessage(coach.quickQuestions?.[0])} 
                        className="w-full p-3 rounded-2xl border border-gray-100 bg-white flex items-center gap-3 text-left active:scale-[0.98] active:bg-gray-50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: coach.bgColor }}>{coach.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{coach.name}</span>
                          <p className="text-[13px] font-medium text-[#333] truncate">{coach.quickQuestions?.[0]}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const coach = msg.coachId ? COACHES.find(c => c.id === msg.coachId) : null;
                return (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} bubble-pop`}>
                    {msg.role === 'assistant' && coach && (
                      <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]" style={{ background: coach.bgColor }}>{coach.avatar}</div>
                        <span className="text-[10px] font-bold text-gray-500">{coach.name} 코치</span>
                      </div>
                    )}
                    <div className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-[#F5B041] text-white rounded-tr-sm' : 'bg-white text-[#3D3D3D] border border-gray-100 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    {msg.tips && (
                      <div className="w-full mt-4">
                        <div className="space-y-2">
                          {msg.tips.slice(0, 2).map((tip, tIdx) => {
                            const category = tip.category || COACH_TO_CATEGORY[msg.coachId || 'ROUTER'] || 'GENERAL';
                            const illustrationCards = ILLUSTRATION_CARDS[category as keyof typeof ILLUSTRATION_CARDS] || ILLUSTRATION_CARDS.GENERAL;
                            const illustCard = illustrationCards[tIdx % illustrationCards.length] as any;
                            
                            return (
                              <div 
                                key={tIdx} 
                                onClick={() => {
                                  setSelectedGuide({
                                    title: illustCard.title || tip.title,
                                    description: illustCard.description || tip.description,
                                    emoji: illustCard.emoji || tip.icon,
                                    gradient: illustCard.gradient,
                                    category: category,
                                    tips: [
                                      '✓ ' + tip.description,
                                      '💡 관련된 다른 팁들도 AI 코치에게 물어보세요!'
                                    ],
                                    fullGuide: illustCard.fullGuide
                                  });
                                }}
                                className="w-full bg-white rounded-2xl p-3 shadow-sm border border-gray-50 fade-in cursor-pointer hover:shadow-md hover:border-gray-100 transition-all active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${illustCard.gradient} flex items-center justify-center text-2xl shrink-0`}>
                                    {(illustCard as any).emoji || tip.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <h4 className="text-[13px] font-bold text-[#222] truncate">{tip.title}</h4>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                        tip.type === 'SUCCESS' ? 'bg-green-50 text-green-600' : 
                                        tip.type === 'WARNING' ? 'bg-amber-50 text-amber-600' : 
                                        'bg-amber-50 text-amber-600'
                                      }`}>
                                        {tip.type === 'SUCCESS' ? '추천' : tip.type === 'WARNING' ? '주의' : '참고'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 line-clamp-1">{tip.description}</p>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                  </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {(() => {
                          const mainCategory = msg.tips[0]?.category || COACH_TO_CATEGORY[msg.coachId || 'ROUTER'] || 'GENERAL';
                          const relatedCards = ILLUSTRATION_CARDS[mainCategory as keyof typeof ILLUSTRATION_CARDS] || ILLUSTRATION_CARDS.GENERAL;
                          
                          return (
                            <div className="mt-3 overflow-x-auto hide-scrollbar w-full">
                              <div className="flex gap-2 pb-1" style={{ minWidth: 'min-content' }}>
                                {relatedCards.slice(0, 3).map((card: any, cardIdx: number) => (
                                  <button 
                                    key={card.id}
                                    onClick={() => {
                                      setSelectedGuide({
                                        title: card.title,
                                        description: card.description,
                                        emoji: card.emoji || '📚',
                                        gradient: card.gradient,
                                        category: mainCategory,
                                        tips: [
                                          '📖 ' + card.description,
                                          '💬 더 자세한 내용은 AI 코치에게 질문해보세요!'
                                        ],
                                        fullGuide: card.fullGuide
                                      });
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                  >
                                    <span className="text-base">{(card as any).emoji || '📚'}</span>
                                    <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap">{card.title}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex flex-col items-start gap-2 mb-6">
                  <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-[32px] border border-gray-100 flex items-center gap-5 shadow-lg rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#F5B041] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#F5B041] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[#F5B041] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-[13px] font-bold text-gray-600">전문 코치가 답변을 준비 중입니다...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-0 shrink-0" />
            </div>

            {/* 하단 입력 영역 */}
            <div className="bg-white border-t border-gray-100 shrink-0 z-50">
              <div className="overflow-x-auto hide-scrollbar py-2 border-b border-gray-50">
                <div className="flex gap-1.5 px-3 min-w-max">
                  <button 
                    onClick={() => setForcedCoachId(null)} 
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${!forcedCoachId ? 'bg-[#F5B041] text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    전체
                  </button>
                  {COACHES.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => setForcedCoachId(c.id)} 
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all ${forcedCoachId === c.id ? 'text-white' : 'bg-gray-100 text-gray-500'}`} 
                      style={{ background: forcedCoachId === c.id ? c.bgColor : undefined }}
                    >
                      <span className="text-xs">{c.avatar}</span>{c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-3 py-2 pb-[env(safe-area-inset-bottom,8px)]">
                <div className="bg-gray-100 rounded-full flex items-center gap-2 pr-1.5">
                  <input 
                    ref={inputRef} 
                    type="text" 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                    placeholder={forcedCoachId ? `${COACHES.find(c => c.id === forcedCoachId)?.name} 코치에게 질문` : "무엇이든 물어보세요"} 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-[#333] pl-4 py-2.5 text-[14px] outline-none placeholder:text-gray-400" 
                  />
                  <button 
                    onClick={() => handleSendMessage()} 
                    disabled={!inputText.trim() || isTyping} 
                    className={`p-2.5 rounded-full transition-all shrink-0 ${inputText.trim() ? 'bg-[#F5B041] text-white active:scale-90' : 'bg-gray-300 text-white'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14m-7-7l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFAF7] tab-content-enter">
            <div className="px-4 py-4">
              {(() => {
                const userMessages = messages.filter(m => m.role === 'user');
                const assistantMessages = messages.filter(m => m.role === 'assistant');
                const lastAssistant = assistantMessages[assistantMessages.length - 1];
                const lastCoach = lastAssistant?.coachId ? COACHES.find(c => c.id === lastAssistant.coachId) : null;
                
                return (
                  <div 
                    onClick={() => setActiveTab('CHATS')}
                    className="bg-gradient-to-br from-[#F5B041] via-[#F7DC6F] to-[#E67E22] p-4 rounded-2xl text-white shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="absolute -right-2 -bottom-2 text-[60px] opacity-10">💬</div>
                    <div className="relative z-10">
                      {userMessages.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                최근 상담
                              </div>
                              {lastCoach && (
                                <div className="px-1.5 py-0.5 bg-white/15 rounded text-[9px] font-medium flex items-center gap-1">
                                  <span className="text-xs">{lastCoach.avatar}</span>
                                  <span>{lastCoach.name}</span>
                                </div>
                              )}
                            </div>
                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                            </svg>
                          </div>
                          <p className="text-[13px] font-medium leading-snug mb-2 line-clamp-1">
                            "{userMessages[userMessages.length - 1]?.content}"
                          </p>
                          <div className="flex items-center gap-1.5 text-white/80">
                            <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-medium">총 {userMessages.length}개 질문 답변 완료</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-medium leading-snug mb-1">
                              AI 코치에게 첫 질문을 해보세요! 🎉
                            </p>
                            <span className="text-[10px] text-white/70">수면, 이유식, 발달, 심리, 배변</span>
                          </div>
                          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div ref={insightsContainerRef} className="flex-1 overflow-y-auto hide-scrollbar px-4 space-y-6 pb-20">
              <section className="fade-in">
                <h3 className="text-base font-black text-[#222] mb-4 flex items-center gap-2">
                  <span>📊</span>
                  <span>상담 통계</span>
                </h3>
                {(() => {
                  const assistantMessages = messages.filter(m => m.role === 'assistant');
                  const totalChats = messages.filter(m => m.role === 'user').length;
                  
                  const coachStats: Record<string, number> = {};
                  assistantMessages.forEach(m => {
                    if (m.coachId) {
                      coachStats[m.coachId] = (coachStats[m.coachId] || 0) + 1;
                    }
                  });
                  
                  const topCoaches = Object.entries(coachStats)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                  
                  const maxCount = topCoaches[0]?.[1] || 1;
                  
                  return (
                    <div className="space-y-4">
                      <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5B041] to-[#E67E22] flex items-center justify-center text-2xl text-white">
                              💬
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-gray-400">총 상담 횟수</p>
                              <p className="text-[28px] font-black text-[#222] leading-tight">{totalChats}<span className="text-[14px] text-gray-400 ml-1">회</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400">받은 답변</p>
                            <p className="text-[18px] font-black text-[#F5B041]">{assistantMessages.length}개</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-50">
                        <p className="text-[12px] font-black text-gray-500 mb-4">🏆 코치별 상담 현황</p>
                        {topCoaches.length > 0 ? (
                          <div className="space-y-3">
                            {topCoaches.map(([coachId, count]) => {
                              const coach = COACHES.find(c => c.id === coachId);
                              if (!coach) return null;
                              const percentage = Math.round((count / maxCount) * 100);
                              return (
                                <div key={coachId} className="flex items-center gap-3">
                                  <div 
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{ background: coach.bgColor }}
                                  >
                                    {coach.avatar}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[12px] font-bold text-[#333]">{coach.name}</span>
                                      <span className="text-[11px] font-black text-gray-400">{count}회</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ 
                                          width: `${percentage}%`,
                                          background: coach.bgColor 
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-3xl mb-2">🤔</p>
                            <p className="text-[13px] text-gray-400 font-medium">아직 상담 내역이 없어요</p>
                            <p className="text-[11px] text-gray-300 mt-1">AI 코치에게 질문해보세요!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </section>

              <section className="fade-in">
                <h3 className="text-base font-black text-[#222] mb-4 flex items-center gap-2">
                  <span>✅</span>
                  <span>실천 체크리스트</span>
                </h3>
                <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-50">
                  {dynamicChecklist.map((item) => (
                    <div key={item.id} onClick={() => toggleChecklist(item.id)} className={`flex items-center gap-4 p-5 cursor-pointer border-b border-gray-50 last:border-none transition-all ${item.completed ? 'bg-gray-50/40' : 'hover:bg-gray-50/50'}`}>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${item.completed ? 'bg-[#F5B041] border-transparent' : 'border-gray-200'}`}>
                        {item.completed && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span className={`text-[14px] font-bold ${item.completed ? 'text-gray-300 line-through' : 'text-[#333]'}`}>{item.text}</span>
                        </div>
                        {item.description && (
                          <p className={`text-[11px] mt-0.5 ${item.completed ? 'text-gray-300' : 'text-gray-400'}`}>{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
