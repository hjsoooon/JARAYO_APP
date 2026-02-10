import React, { useState, useRef, useMemo } from 'react';
import { BabyProfile, PHRRecord, RecordType, FeedType, PoopType } from '../types';
import { UserCircle, Moon, Utensils, Baby, Droplets, Droplet, MessageCircle, ChevronLeft, ChevronRight, Mic, Send, X, MoreHorizontal, Milk, Coffee, Soup, Sparkles, Trash2, Calendar as CalendarIcon, Camera, Loader2, ScanLine } from 'lucide-react';
import PoopScanApp from './poopscan/PoopScanApp';

interface HomeTabProps {
  profile: BabyProfile;
  records: PHRRecord[];
  onQuickAdd: (type: RecordType, subtype?: string) => void;
  onOpenTimer: () => void; 
  onEditRecord: (record: PHRRecord) => void;
  onGenerateDiary: (text: string) => void;
  onGoToReport: (date: Date) => void;
  onUpdateProfile: (updates: Partial<BabyProfile>) => void;
  onOpenSettings?: () => void;
}

const BASE_URL = import.meta.env.BASE_URL || '/';

const CHARACTERS = {
  BOY: [
    `${BASE_URL}characters/prince1.png`,
    `${BASE_URL}characters/prince2.png`,
    `${BASE_URL}characters/prince3.png`
  ],
  GIRL: [
    `${BASE_URL}characters/princess1.png`,
    `${BASE_URL}characters/princess2.png`,
    `${BASE_URL}characters/princess3.png`
  ]
};

const RANDOM_QUESTIONS = [
  "{name}(이)는 오늘 엄마 아빠랑 무엇을 하고 싶었을까요?",
  "오늘 {name}의 꿈속에는 어떤 친구들이 찾아올까요?",
  "{name}(이)가 오늘 가장 기분 좋았던 순간은 언제였을까요?",
  "오늘 {name}(이)의 하루를 한 문장으로 그린다면 어떤 모습일까요?",
  "{name}(이)에게 오늘 가장 들려주고 싶은 응원의 말은 무엇인가요?",
  "오늘 {name}(이)가 본 세상은 어떤 색깔이었을까요?"
];

export const HomeTab: React.FC<HomeTabProps> = ({ 
  profile, 
  records, 
  onQuickAdd, 
  onOpenTimer,
  onEditRecord, 
  onGenerateDiary,
  onGoToReport,
  onUpdateProfile,
  onOpenSettings
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState<RecordType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPoopScan, setShowPoopScan] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayQuestion = useMemo(() => {
    const daySeed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < daySeed.length; i++) {
      hash = daySeed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % RANDOM_QUESTIONS.length;
    return RANDOM_QUESTIONS[index].replace("{name}", profile.name);
  }, [profile.name]);

  const birth = new Date(profile.birthDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const filteredRecords = records.filter(rec => {
    const recDate = new Date(rec.timestamp);
    return recDate.toDateString() === currentDate.toDateString();
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleReplySubmit = () => {
    if (replyText.trim()) {
      onGenerateDiary(replyText);
      setReplyText('');
      setShowReply(false);
    }
  };

  const handleIconClick = (type: RecordType) => {
    if (type === 'FEED' || type === 'POOP') {
      setActiveMenu(type);
    } else {
      setActiveMenu(null);
      onQuickAdd(type);
    }
  };

  const handleSubtypeClick = (type: RecordType, subtype: string) => {
    setActiveMenu(null);
    if (type === 'FEED' && subtype === 'BREAST') {
      onOpenTimer();
    } else {
      onQuickAdd(type, subtype);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsGenerating(true);
    
    // 파일 업로드 후 온보딩에서 입력한 성별에 맞게 랜덤 캐릭터 생성
    setTimeout(() => {
      try {
        // 온보딩에서 입력한 성별 확인 (BOY = 왕자님, GIRL = 공주님)
        const genderKey = profile.gender === 'BOY' ? 'BOY' : 'GIRL';
        const characterSet = CHARACTERS[genderKey];
        
        if (!characterSet || characterSet.length === 0) {
          console.error('캐릭터 세트를 찾을 수 없습니다:', genderKey);
          setIsGenerating(false);
          return;
        }
        
        // 랜덤으로 캐릭터 선택
        const randomIndex = Math.floor(Math.random() * characterSet.length);
        const randomCharacter = characterSet[randomIndex];
        
        if (!randomCharacter) {
          console.error('랜덤 캐릭터를 생성할 수 없습니다');
          setIsGenerating(false);
          return;
        }
        
        // 프로필 업데이트
        onUpdateProfile({ 
          photoUrl: randomCharacter, 
          hasCharacter: true 
        });
        
        setIsGenerating(false);
      } catch (error) {
        console.error('캐릭터 생성 중 오류 발생:', error);
        setIsGenerating(false);
      }
    }, 2500); 
    
    // 파일 input 초기화 (같은 파일을 다시 선택할 수 있도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRecordSummary = (rec: PHRRecord) => {
    if (rec.type === 'SLEEP') {
      if (rec.endTime) {
        const start = new Date(rec.timestamp);
        const end = new Date(rec.endTime);
        const diffMins = Math.floor((end.getTime() - start.getTime()) / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours > 0 ? `${hours}시간 ` : ''}${mins}분 수면`;
      }
      return '수면 중...';
    }
    if (rec.type === 'FEED') {
       if (rec.subtype === 'BREAST') return rec.value || '모유 수유';
       return `${rec.subtype === 'FORMULA' ? '분유' : '이유식'} ${rec.value || ''}`;
    }
    if (rec.type === 'POOP') {
       return rec.subtype === 'PEE' ? '소변' : '대변';
    }
    if (rec.type === 'BATH') {
       return '목욕';
    }
    return '';
  };

  const getTimelineIcon = (rec: PHRRecord) => {
    if (rec.type === 'FEED') {
       if (rec.subtype === 'BREAST') return <Milk size={14} className="text-rose-400" />;
       if (rec.subtype === 'FORMULA') return <Coffee size={14} className="text-sky-400" />;
       return <Soup size={14} className="text-emerald-400" />;
    }
    if (rec.type === 'POOP') {
       return rec.subtype === 'PEE' ? <Droplets size={14} className="text-sky-400" /> : <Trash2 size={14} className="text-[#92400e]" />;
    }
    if (rec.type === 'SLEEP') return <Moon size={14} className="text-indigo-400" />;
    if (rec.type === 'BATH') return <Droplet size={14} className="text-blue-400" />;
    return null;
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div className="pb-8 min-h-full">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* Generating UI Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[6px] z-[70] flex items-center justify-center animate-in fade-in duration-300">
            <div className="bg-white/95 p-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300 max-w-[80%]">
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse"></div>
                  <Loader2 className="animate-spin text-secondary relative z-10" size={48} />
               </div>
               <div className="text-center">
                  <h4 className="font-bold text-gray-800 text-lg mb-2">3D 캐릭터 생성 중</h4>
                  <p className="text-xs text-gray-400 font-medium">우리 아기 캐릭터를 AI가 만들고 있어요...</p>
               </div>
            </div>
        </div>
      )}

      {/* Dim Overlay for Bubble Menus */}
      {activeMenu && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-in fade-in duration-300" onClick={() => setActiveMenu(null)} />
      )}

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{profile.name}의 하루</h1>
          </div>
          <button 
            onClick={onOpenSettings}
            className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-400 hover:bg-amber-100 hover:text-amber-600 transition-colors"
          >
            <UserCircle size={22} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* Floating Character Area (Updated for bigger size and no circle) */}
      <section className="px-6 py-10 text-center flex flex-col items-center">
        {/* D-Day Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full shadow-lg">
          <span className="text-2xl font-bold text-white">D+{diffDays}일</span>
        </div>

        <div 
          className="relative w-full max-w-[240px] aspect-square flex items-center justify-center group cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
          {profile.photoUrl ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Floating Animation Image */}
              <div className="animate-float w-full h-full flex items-center justify-center">
                <img 
                  src={profile.photoUrl} 
                  alt="Baby Character" 
                  className="w-full h-full object-cover rounded-[48px] shadow-2xl z-10 animate-in zoom-in duration-700" 
                />
              </div>
              
              {/* Floating Shadow Underneath */}
              <div className="absolute -bottom-2 w-[80%] h-4 bg-black/20 rounded-[100%] blur-md animate-shadow z-0" />
              
              {/* Decorative sparkles */}
              <div className="absolute top-0 right-0 bg-white p-3 rounded-full shadow-lg text-secondary border border-gray-100 z-20 animate-pulse">
                 <Sparkles size={20} />
              </div>
            </div>
          ) : (
             <div className="relative w-full h-full bg-white/50 rounded-[64px] border-4 border-dashed border-yellow-200 flex flex-col items-center justify-center p-8 shadow-inner hover:border-primary transition-all active:scale-95">
                <span className="text-6xl mb-4 animate-bounce">👶</span>
                <p className="text-gray-400 font-bold mb-6 text-[12px] leading-tight">아기 사진을 등록하고<br/>귀여운 3D 캐릭터를 만나보세요!</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="bg-primary text-yellow-900 px-6 py-3 rounded-2xl font-bold text-[13px] shadow-md active:scale-90 transition-all flex items-center gap-2"
                >
                   <Camera size={16} />
                   캐릭터 만들기
                </button>
             </div>
          )}
        </div>

        {/* Spacer between character and card */}
        <div className="h-10" />

        {/* TODAY'S QUESTION CARD */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[40px] p-8 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-white/50 text-center w-full max-w-sm mx-auto mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex items-center justify-center gap-1.5 mb-6">
              <Sparkles size={14} className="text-[#FF5C8A]" fill="#FF5C8A" />
              <span className="text-[10px] font-bold text-[#FF5C8A] uppercase tracking-[0.2em]">Today's Question</span>
           </div>
           
           <h2 className="text-[18px] font-bold text-gray-800 mb-8 leading-[1.6]">
              {todayQuestion}
           </h2>
           
           <button 
             onClick={() => setShowReply(true)}
             className="w-full bg-[#2D2926] text-white py-4 rounded-[24px] font-bold text-[15px] shadow-md active:scale-95 transition-all"
           >
             답장하기
           </button>
        </div>
      </section>

      {/* Quick Actions (PHR) */}
      <section className="px-6 py-4 relative">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-bold text-gray-800">기록 (PHR)</h2>
           <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
              <button onClick={() => handleDateChange(-1)} className="p-1.5 text-gray-400 hover:text-secondary hover:bg-orange-50 rounded-xl transition-colors"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50/50 rounded-lg">
                 <CalendarIcon size={14} className="text-secondary" /><span className="text-[13px] font-bold text-gray-700">{isToday ? '오늘' : currentDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
              </div>
              <button onClick={() => handleDateChange(1)} className={`p-1.5 rounded-xl transition-colors ${isToday ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-secondary hover:bg-orange-50'}`} disabled={isToday}><ChevronRight size={16} /></button>
           </div>
        </div>

        <div className="grid grid-cols-4 gap-3 relative z-50">
          {[
            { id: 'SLEEP', icon: Moon, label: '수면', color: 'bg-indigo-50 text-indigo-500 border-indigo-100' },
            { id: 'FEED', icon: Utensils, label: '수유', color: 'bg-orange-50 text-orange-500 border-orange-100' },
            { id: 'POOP', icon: Baby, label: '배변', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
            { id: 'BATH', icon: Droplet, label: '목욕', color: 'bg-blue-50 text-blue-500 border-blue-100' },
          ].map((action) => {
             const Icon = action.icon;
             const isDimmed = activeMenu && activeMenu !== action.id;
             return (
               <div key={action.id} className="relative">
                 <button onClick={() => handleIconClick(action.id as RecordType)} className={`flex flex-col items-center gap-2 w-full transition-all duration-300 ${isDimmed ? 'opacity-30 scale-90' : 'opacity-100 scale-100'}`}>
                   <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shadow-sm border ${action.color} active:scale-95 transition-transform`}><Icon size={24} /></div>
                   <span className="text-[11px] font-bold text-gray-500">{action.label}</span>
                 </button>
                 
                 {/* FEED Sub-menu with Labels */}
                 {activeMenu === 'FEED' && action.id === 'FEED' && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-4 z-[60] animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center gap-2">
                           <button onClick={() => handleSubtypeClick('FEED', 'BREAST')} className="w-16 h-16 rounded-full bg-white border-2 border-rose-200 text-rose-400 shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                              <Milk size={28} />
                           </button>
                           <span className="text-[10px] font-bold text-rose-500 bg-white/95 px-2 py-0.5 rounded-full shadow-sm">모유</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <button onClick={() => handleSubtypeClick('FEED', 'FORMULA')} className="w-16 h-16 rounded-full bg-white border-2 border-sky-200 text-sky-400 shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                              <Coffee size={28} />
                           </button>
                           <span className="text-[10px] font-bold text-sky-600 bg-white/95 px-2 py-0.5 rounded-full shadow-sm">분유</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <button onClick={() => handleSubtypeClick('FEED', 'FOOD')} className="w-16 h-16 rounded-full bg-white border-2 border-emerald-200 text-emerald-400 shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                              <Soup size={28} />
                           </button>
                           <span className="text-[10px] font-bold text-emerald-600 bg-white/95 px-2 py-0.5 rounded-full shadow-sm">이유식</span>
                        </div>
                    </div>
                 )}
                 
                 {/* POOP Sub-menu with Labels */}
                 {activeMenu === 'POOP' && action.id === 'POOP' && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-5 z-[60] animate-in zoom-in duration-200">
                        <div className="flex flex-col items-center gap-2">
                           <button onClick={() => handleSubtypeClick('POOP', 'PEE')} className="w-16 h-16 rounded-full bg-white border-2 border-sky-200 text-sky-500 shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                              <Droplets size={28} />
                           </button>
                           <span className="text-[10px] font-bold text-sky-600 bg-white/95 px-2 py-0.5 rounded-full shadow-sm">소변</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <button onClick={() => handleSubtypeClick('POOP', 'POO')} className="w-16 h-16 rounded-full bg-white border-2 border-[#92400e]/30 text-[#92400e] shadow-xl flex items-center justify-center active:scale-90 transition-transform">
                              <Trash2 size={28} />
                           </button>
                           <span className="text-[10px] font-bold text-[#92400e] bg-white/95 px-2 py-0.5 rounded-full shadow-sm">대변</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <button onClick={() => { setActiveMenu(null); setShowPoopScan(true); }} className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-300 text-purple-600 shadow-xl flex items-center justify-center active:scale-90 transition-transform relative overflow-hidden">
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite]"></div>
                              <ScanLine size={28} className="relative z-10" />
                           </button>
                           <span className="text-[10px] font-bold text-purple-600 bg-white/95 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">AI 푸스캔</span>
                        </div>
                    </div>
                 )}
               </div>
             )
          })}
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 pb-20 mt-6">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">Today's Timeline</h3>
            <button onClick={() => onGoToReport(currentDate)} className="text-xs text-secondary font-bold flex items-center gap-1">분석 리포트 <ChevronRight size={14} /></button>
         </div>
         <div className="relative border-l-2 border-gray-100 ml-4 space-y-4">
            {filteredRecords.length === 0 ? (
                <div className="pl-8 py-10 text-center text-gray-300 text-sm italic">기록된 내용이 없습니다.</div>
            ) : (
                filteredRecords.map((rec) => (
                    <div key={rec.id} className="relative pl-8 cursor-pointer group" onClick={() => onEditRecord(rec)}>
                        <div className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${rec.type === 'SLEEP' ? 'bg-indigo-400' : rec.type === 'FEED' ? 'bg-orange-400' : rec.type === 'POOP' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50 group-active:scale-[0.98] transition-all">
                           <div className="flex justify-between items-center mb-2">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${rec.type === 'SLEEP' ? 'bg-indigo-50 text-indigo-600' : rec.type === 'FEED' ? 'bg-orange-50 text-orange-600' : rec.type === 'POOP' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                                 {rec.type === 'FEED' ? (rec.subtype === 'BREAST' ? '모유' : (rec.subtype === 'FORMULA' ? '분유' : '이유식')) : rec.type === 'POOP' ? (rec.subtype === 'PEE' ? '소변' : '대변') : rec.type === 'SLEEP' ? '수면' : '목욕'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">{new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              {getTimelineIcon(rec)}
                              <p className="text-gray-800 text-sm font-bold">{getRecordSummary(rec)}</p>
                           </div>
                        </div>
                    </div>
                ))
            )}
         </div>
      </section>

      {/* Reply Modal */}
      {showReply && (
         <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowReply(false)} />
            <div className="bg-white w-full max-w-md rounded-t-[40px] p-8 z-10 animate-slide-up pb-safe shadow-2xl">
               <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
               <h3 className="font-bold text-2xl mb-2 text-center text-gray-800">아기에게 답장하기</h3>
               <p className="text-center text-gray-400 text-sm mb-8 leading-relaxed">들려주시는 따뜻한 이야기가<br/>아이의 소중한 동화 일기가 됩니다.</p>
               <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 min-h-[160px] outline-none text-gray-700 resize-none mb-6 focus:ring-4 ring-primary/20 transition-all text-sm" placeholder="오늘 우리 아기, 정말 잘 자고 잘 먹었어..." />
               <div className="flex gap-4">
                  <button onClick={() => { setIsRecording(!isRecording); if (!isRecording) setTimeout(() => { setReplyText("오늘 우리 아기는 낮잠을 두 번이나 잤어. 분유도 160ml 씩 잘 먹었구!"); setIsRecording(false); }, 2500); }} className={`p-5 rounded-3xl transition-all shadow-md active:scale-95 ${isRecording ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Mic size={24} /></button>
                  <button onClick={handleReplySubmit} disabled={!replyText && !isRecording} className="flex-1 bg-[#2D2926] text-white font-bold rounded-3xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg active:scale-95 transition-all text-lg"><span>동화 생성</span><Send size={20} /></button>
               </div>
            </div>
         </div>
      )}

      {/* AI 푸스캔 모달 */}
      {showPoopScan && (
        <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
          <div className="w-full h-full max-w-md relative">
            <PoopScanApp onClose={() => setShowPoopScan(false)} />
          </div>
        </div>
      )}
    </div>
  );
};