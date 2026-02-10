import React, { useState, useRef, useMemo } from 'react';
import { DiaryEntry } from '../types';
import { Search, ChevronLeft, ChevronRight, Heart, Clock, Image as ImageIcon, Plus, Calendar as CalendarIcon, Loader2, Play, Pause, ShoppingBag, Moon, Utensils, Baby, Droplet, Volume2, FileText, BookOpen } from 'lucide-react';
import { AppHeader, HeaderIconButton } from './AppHeader';

interface DiaryTabProps {
  diaries: DiaryEntry[];
}

type ViewMode = 'grid' | 'single' | 'storybook' | 'bookPreview';

export const DiaryTab: React.FC<DiaryTabProps> = ({ diaries }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStory, setSelectedStory] = useState<DiaryEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [coverType, setCoverType] = useState<'hard' | 'soft'>('hard');
  const [paperType, setPaperType] = useState<'randevu' | 'montblanc' | 'arte'>('randevu');
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [showPoopScan, setShowPoopScan] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 월별 진행도 계산
  const currentMonth = new Date().getMonth() + 1;
  const monthlyDiaries = diaries.filter(d => new Date(d.date).getMonth() + 1 === selectedMonth);
  const progress = Math.min((monthlyDiaries.length / 10) * 100, 100);

  // 검색 및 월 필터링
  const filteredDiaries = useMemo(() => {
    let filtered = diaries;
    
    // 월 필터
    if (selectedMonth) {
      filtered = filtered.filter(d => new Date(d.date).getMonth() + 1 === selectedMonth);
    }
    
    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(diary => 
        diary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (diary.babyContent || diary.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
        diary.date.includes(searchQuery)
      );
    }
    
    return filtered;
  }, [diaries, searchQuery, selectedMonth]);


  // PHR 아이콘 가져오기
  const getPHRIcons = (diary: DiaryEntry) => {
    if (!diary.phrSummary || diary.phrSummary.length === 0) return null;
    
    return diary.phrSummary.map((type, idx) => {
      switch(type) {
        case 'SLEEP': return <Moon key={idx} size={14} className="text-indigo-400" />;
        case 'FEED': return <Utensils key={idx} size={14} className="text-orange-400" />;
        case 'POOP': return <Baby key={idx} size={14} className="text-yellow-500" />;
        case 'BATH': return <Droplet key={idx} size={14} className="text-blue-400" />;
        default: return null;
      }
    });
  };

  // 동화책 시안 보기
  const openBookPreview = () => {
    setViewMode('bookPreview');
  };

  const handleGridClick = (diary: DiaryEntry) => {
    const index = filteredDiaries.findIndex(d => d.id === diary.id);
    setCurrentIndex(index !== -1 ? index : 0);
    setSelectedStory(diary);
    setViewMode('storybook'); // 바로 스토리북 모드로 이동
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  const formatDateDot = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.');
  };

  const togglePlayStory = () => {
    if (!selectedStory) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(selectedStory.content);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  // 동화책 만들기 페이지
  if (viewMode === 'bookPreview') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        {/* 헤더 */}
        <AppHeader variant="left" title="동화책 만들기" onBack={() => setViewMode('grid')} />

        <div className="flex-1 overflow-y-auto pb-32">
          {/* 표지 미리보기 */}
          <div className="flex justify-center py-8 px-6">
            <div className="w-[200px] bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="relative aspect-[3/4] bg-gradient-to-br from-green-800/80 to-green-900/90">
                {monthlyDiaries[0]?.mainImageUrl && (
                  <img 
                    src={monthlyDiaries[0].mainImageUrl} 
                    alt="Book Cover" 
                    className="w-full h-full object-cover opacity-30" 
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-[8px] text-yellow-300 tracking-[0.3em] uppercase font-bold mb-4">Special Edition</span>
                  <h3 className="text-white text-lg font-bold leading-snug mb-3">
                    {selectedMonth}월의 동화책
                  </h3>
                  <p className="text-white/60 text-[9px]">Omniscient Baby View Storybook</p>
                </div>
              </div>
            </div>
          </div>

          {/* 수록될 이야기 */}
          <div className="px-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">수록될 이야기</h3>
              <span className="text-sm text-gray-500">총 {monthlyDiaries.length}편</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {monthlyDiaries.map((diary) => (
                <div key={diary.id} className="shrink-0 w-[80px]">
                  <div className="w-[80px] h-[80px] rounded-xl overflow-hidden bg-yellow-100 mb-2 shadow-sm">
                    <img 
                      src={diary.mainImageUrl || diary.imageUrl} 
                      alt={diary.title} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight font-medium">{diary.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 커버 종류 */}
          <div className="px-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-4">커버 종류</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setCoverType('hard')}
                className={`p-5 rounded-2xl text-left transition-all ${
                  coverType === 'hard' 
                    ? 'bg-white border-2 border-yellow-400 shadow-md' 
                    : 'bg-white border-2 border-transparent shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800 text-sm">하드커버</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    coverType === 'hard' ? 'border-yellow-400' : 'border-gray-200'
                  }`}>
                    {coverType === 'hard' && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">오랫동안 간직해 주는 튼튼한 고급 양장 제본</p>
              </button>
              
              <button 
                onClick={() => setCoverType('soft')}
                className={`p-5 rounded-2xl text-left transition-all ${
                  coverType === 'soft' 
                    ? 'bg-white border-2 border-yellow-400 shadow-md' 
                    : 'bg-white border-2 border-transparent shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800 text-sm">소프트커버</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    coverType === 'soft' ? 'border-yellow-400' : 'border-gray-200'
                  }`}>
                    {coverType === 'soft' && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">가볍고 부드러운 PUR 무선 제본</p>
              </button>
            </div>
          </div>

          {/* 종이 재질 */}
          <div className="px-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-4">종이 재질</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setPaperType('randevu')}
                className={`w-full p-5 rounded-2xl text-left transition-all ${
                  paperType === 'randevu' 
                    ? 'bg-white border-2 border-yellow-400 shadow-md' 
                    : 'bg-white border-2 border-transparent shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800 text-sm">랑데부 190g (고급지)</span>
                    <p className="text-[11px] text-gray-400 mt-1">코팅 감촉이 부드럽고 잉크 발색이 탁월</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paperType === 'randevu' ? 'border-yellow-400' : 'border-gray-200'
                  }`}>
                    {paperType === 'randevu' && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setPaperType('montblanc')}
                className={`w-full p-5 rounded-2xl text-left transition-all ${
                  paperType === 'montblanc' 
                    ? 'bg-white border-2 border-yellow-400 shadow-md' 
                    : 'bg-white border-2 border-transparent shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800 text-sm">몽블랑 160g (내추럴)</span>
                    <p className="text-[11px] text-gray-400 mt-1">종이 본연의 결이 살아있는 따뜻한 질감</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paperType === 'montblanc' ? 'border-yellow-400' : 'border-gray-200'
                  }`}>
                    {paperType === 'montblanc' && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setPaperType('arte')}
                className={`w-full p-5 rounded-2xl text-left transition-all ${
                  paperType === 'arte' 
                    ? 'bg-white border-2 border-yellow-400 shadow-md' 
                    : 'bg-white border-2 border-transparent shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800 text-sm">아르떼 210g (프리미엄)</span>
                    <p className="text-[11px] text-gray-400 mt-1">도톰한 무게감과 깊이 있는 색감 표현</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    paperType === 'arte' ? 'border-yellow-400' : 'border-gray-200'
                  }`}>
                    {paperType === 'arte' && <div className="w-3 h-3 rounded-full bg-yellow-400"></div>}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 주문 완료 팝업 */}
        {showOrderComplete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOrderComplete(false)} />
            <div className="relative bg-white rounded-3xl p-8 mx-6 max-w-sm w-full shadow-2xl text-center z-10">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">동화책 주문이 완료되었습니다!</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                소중한 동화책이 정성껏 제작되어<br/>빠른 시일 내에 배송될 예정이에요.
              </p>
              <button
                onClick={() => {
                  setShowOrderComplete(false);
                  setViewMode('grid');
                }}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-[15px] active:scale-95 transition-transform"
              >
                확인
              </button>
            </div>
          </div>
        )}

        {/* 하단 주문 버튼 */}
        <div className="sticky bottom-20 left-0 right-0 px-6 pt-6 pb-2 bg-gradient-to-t from-white via-white to-white/0">
          <button 
            onClick={() => setShowOrderComplete(true)}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-[15px] shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            동화책 주문하기 <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // 스토리북 뷰 (오디오북)
  if (viewMode === 'storybook' && selectedStory) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <AppHeader
          variant="left"
          title={selectedStory.title}
          onBack={() => {
            setViewMode('grid');
            window.speechSynthesis.cancel();
            setIsPlaying(false);
          }}
        />

        <div className="flex-1 overflow-y-auto pb-10">
          {/* 표지 이미지 */}
          <div className="relative w-full aspect-[4/3] bg-white shadow-lg mb-8 rounded-b-[2.5rem] overflow-hidden">
            <img 
              src={selectedStory.mainImageUrl || selectedStory.imageUrl} 
              alt="Book Cover" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-20 text-white">
              <h1 className="text-3xl font-bold leading-tight drop-shadow-lg">{selectedStory.title}</h1>
              <p className="text-sm mt-2 opacity-90 drop-shadow">{formatDate(selectedStory.date)}</p>
            </div>
            <button 
              onClick={togglePlayStory}
              className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-lg hover:bg-white/50 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>

          {/* 동화 본문 */}
          <div className="px-8 mb-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <p className="text-gray-700 leading-[2.0] text-[17px] text-justify whitespace-pre-line first-letter:text-6xl first-letter:font-bold first-letter:text-secondary first-letter:mr-3 first-letter:float-left first-letter:leading-[1]">
                {selectedStory.content}
              </p>
            </div>
          </div>

          {/* 엄마/아빠의 기록 */}
          {selectedStory.babyContent && (
            <div className="px-8 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} className="text-yellow-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  엄마/아빠의 기록
                </h3>
              </div>
              <div className="bg-yellow-50 rounded-3xl p-6 shadow-sm border-2 border-yellow-100">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  "{selectedStory.babyContent}"
                </p>
              </div>
            </div>
          )}

          {/* PHR 요약 */}
          {selectedStory.phrSummary && selectedStory.phrSummary.length > 0 && (
            <div className="px-8 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-red-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Today's Activities
                </h3>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {selectedStory.phrSummary.map((type, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-2 min-w-[100px]">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                      {type === 'SLEEP' && <Moon size={20} className="text-indigo-400" />}
                      {type === 'FEED' && <Utensils size={20} className="text-orange-400" />}
                      {type === 'POOP' && <Baby size={20} className="text-yellow-500" />}
                      {type === 'BATH' && <Droplet size={20} className="text-blue-400" />}
                    </div>
                    <span className="text-xs font-bold text-gray-600">
                      {type === 'SLEEP' && '수면'}
                      {type === 'FEED' && '수유'}
                      {type === 'POOP' && '배변'}
                      {type === 'BATH' && '목욕'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 갤러리 */}
          {selectedStory.gallery && selectedStory.gallery.length > 0 && (
            <div className="px-8 mb-8">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={16} className="text-yellow-400" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Gallery
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedStory.gallery.map((imgUrl, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
                    <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="px-8 pb-8 flex gap-4">
          <button
            onClick={() => {
              if (currentIndex < filteredDiaries.length - 1) {
                const nextDiary = filteredDiaries[currentIndex + 1];
                setCurrentIndex(currentIndex + 1);
                setSelectedStory(nextDiary);
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
            }}
            disabled={currentIndex >= filteredDiaries.length - 1}
            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-center gap-2 text-gray-600 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
            이전 일기
          </button>
          <button
            onClick={() => {
              if (currentIndex > 0) {
                const prevDiary = filteredDiaries[currentIndex - 1];
                setCurrentIndex(currentIndex - 1);
                setSelectedStory(prevDiary);
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
            }}
            disabled={currentIndex <= 0}
            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 bg-white flex items-center justify-center gap-2 text-gray-600 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            다음 일기
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // 빈 상태
  const isEmpty = filteredDiaries.length === 0;
  
  if (diaries.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <AppHeader variant="center" title="동화 일기" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <BookOpen size={56} className="text-yellow-300 mb-6" strokeWidth={1.5} />
          <p className="font-bold text-xl text-gray-800">아직 기록된 이야기가 없어요.</p>
          <p className="text-sm mt-3 text-gray-500">홈에서 오늘의 질문에 답해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9] pb-20">
      {/* Header */}
      <AppHeader variant="center" title="동화 일기" />

      {/* Progress Card - 모든 뷰에서 표시 */}
      <div className="px-5 pt-4 pb-2">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 mb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="font-bold text-gray-700">{currentMonth}월 동화책 완성도</span>
            <span className="text-2xl font-bold text-secondary">{Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: `${progress}%` }} 
            />
          </div>
            <p className="text-xs text-gray-400 mb-4">
              한 달의 동화 일기가 모이면 실물 동화책을 배송받을 수 있어요
            </p>
            <button 
              onClick={openBookPreview}
              disabled={monthlyDiaries.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                monthlyDiaries.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : progress >= 100
                  ? 'bg-secondary text-white hover:bg-orange-600 shadow-lg'
                  : 'bg-white text-secondary border-2 border-secondary hover:bg-secondary hover:text-white'
              }`}
            >
              <ShoppingBag size={16} />
              {monthlyDiaries.length === 0 
                ? '일기를 작성해주세요'
                : progress >= 100 
                ? '동화 일기책 만들기' 
                : '지금 바로 동화책 만들기'}
            </button>
        </div>
      </div>

      {/* 월 필터 */}
      {viewMode === 'grid' && (
        <div className="px-5 pt-2 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
              const monthDiaries = diaries.filter(d => new Date(d.date).getMonth() + 1 === month);
              if (monthDiaries.length === 0 && month !== currentMonth) return null;
              
              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedMonth === month
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white text-gray-500 hover:bg-amber-50'
                  }`}
                >
                  {month}월 ({monthDiaries.length})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 검색 */}
      {viewMode === 'grid' && (
        <div className="px-5 pb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-300" size={18} />
            </div>
            <input
              className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-sm border border-gray-100 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-50 transition-all placeholder-gray-300 text-gray-800"
              placeholder="검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Content - Grid View */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-60 px-6 text-center">
          <BookOpen size={56} className="text-yellow-300 mb-6" strokeWidth={1.5} />
          <p className="font-bold text-xl text-gray-800">
            {searchQuery ? "검색된 이야기가 없어요." : "이번 달 기록된 이야기가 없어요."}
          </p>
          {!searchQuery && <p className="text-sm mt-3 text-gray-500">홈에서 오늘의 질문에 답해보세요.</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-3">
          <div className="grid grid-cols-2 gap-4 pb-24">
            {filteredDiaries.map((diary) => (
              <button 
                key={diary.id} 
                onClick={() => handleGridClick(diary)} 
                className="bg-white rounded-[2rem] p-4 shadow-sm flex flex-col gap-3 group text-left transition-transform active:scale-95 border border-white"
              >
                <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden bg-yellow-50">
                  <img 
                    src={diary.mainImageUrl || diary.imageUrl} 
                    alt={diary.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                    <span className="text-[10px] font-bold text-gray-800">
                      {formatDateDot(diary.date)}
                    </span>
                  </div>
                </div>
                <div className="px-1 pb-1">
                  <h4 className="text-[14px] font-bold text-gray-800 leading-snug line-clamp-1 mb-1.5">
                    {diary.title}
                  </h4>
                  <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed font-medium mb-2">
                    {diary.babyContent || diary.content}
                  </p>
                  {/* PHR 아이콘 요약 */}
                  {diary.phrSummary && diary.phrSummary.length > 0 && (
                    <div className="flex gap-1.5 items-center">
                      {getPHRIcons(diary)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
