import React, { useState, useRef, useMemo } from 'react';
import { DiaryEntry } from '../types';
import { Search, BookOpen, LayoutGrid, ChevronLeft, ChevronRight, Heart, Clock, Image as ImageIcon, Plus, Calendar as CalendarIcon, Loader2, Play, Pause, ShoppingBag, Moon, Utensils, Baby, Droplet, Volume2, FileText } from 'lucide-react';

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

  const displayDiaries = viewMode === 'grid' ? filteredDiaries : diaries;
  const currentDiary = displayDiaries[currentIndex];

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

  const handlePrevDay = () => {
    if (currentIndex < displayDiaries.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNextDay = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleGridClick = (diary: DiaryEntry) => {
    const index = displayDiaries.findIndex(d => d.id === diary.id);
    setCurrentIndex(index !== -1 ? index : 0);
    setViewMode('single');
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const togglePlayStory = () => {
    if (!currentDiary) return;
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(currentDiary.content);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const openStorybook = (diary: DiaryEntry) => {
    setSelectedStory(diary);
    setViewMode('storybook');
  };

  // 동화책 시안 페이지
  if (viewMode === 'bookPreview') {
    return (
      <div className="h-full flex flex-col bg-cream">
        <div className="px-6 pt-4 pb-2 flex items-center justify-center h-[58px] bg-cream sticky top-0 z-10">
          <button 
            onClick={() => setViewMode('grid')} 
            className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-yellow-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-bold text-lg text-gray-800">동화책 시안 미리보기</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-10 px-6">
          {/* 표지 미리보기 */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">표지</h3>
            <div className="bg-white p-4 rounded-3xl shadow-lg">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-yellow-100 to-orange-100">
                {diaries[0]?.mainImageUrl && (
                  <img 
                    src={diaries[0].mainImageUrl} 
                    alt="Book Cover" 
                    className="w-full h-full object-cover opacity-80" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                  <h1 className="text-3xl font-bold mb-4 text-center drop-shadow-lg">
                    {selectedMonth}월의 동화책
                  </h1>
                  <p className="text-sm opacity-90 drop-shadow">
                    {diaries[0]?.babyAgeWeeks && `${Math.floor(diaries[0].babyAgeWeeks / 4)}개월의 기록`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 목차 미리보기 */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">목차</h3>
            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-3">
              {monthlyDiaries.slice(0, 10).map((diary, idx) => (
                <div key={diary.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-yellow-50 transition-colors">
                  <span className="text-gray-400 font-bold text-sm w-8">{idx + 1}.</span>
                  <span className="flex-1 text-gray-800 font-medium text-sm">{diary.title}</span>
                  <span className="text-gray-400 text-xs">{formatDateShort(diary.date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 샘플 페이지 */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">샘플 페이지</h3>
            {diaries[0] && (
              <div className="bg-white p-6 rounded-3xl shadow-sm">
                <div className="mb-4">
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{diaries[0].title}</h4>
                  <p className="text-xs text-gray-400">{formatDate(diaries[0].date)}</p>
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden mb-4">
                  <img 
                    src={diaries[0].mainImageUrl || diaries[0].imageUrl} 
                    alt="Sample page" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-6">
                  {diaries[0].content}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 주문하기 CTA */}
        <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0">
          <button 
            onClick={() => alert('주문 기능은 준비중입니다!')}
            className="w-full bg-gradient-to-r from-secondary to-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
          >
            실물 동화책 주문하기
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            배송지 입력 및 결제는 다음 단계에서 진행됩니다
          </p>
        </div>
      </div>
    );
  }

  // 스토리북 뷰
  if (viewMode === 'storybook' && selectedStory) {
    return (
      <div className="h-full flex flex-col bg-cream">
        <div className="px-6 pt-4 pb-2 flex items-center justify-center h-[58px] bg-cream sticky top-0 z-10">
          <button 
            onClick={() => setViewMode('single')} 
            className="absolute left-6 p-2 -ml-2 rounded-full hover:bg-yellow-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="font-bold text-lg text-gray-800 truncate px-10">{selectedStory.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-10">
          <div className="relative w-full aspect-[4/3] bg-white shadow-lg mb-8 rounded-b-[2.5rem] overflow-hidden">
            <img 
              src={selectedStory.mainImageUrl || selectedStory.imageUrl} 
              alt="Book Cover" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-20 text-white">
              <h1 className="text-3xl font-bold leading-tight drop-shadow-lg">{selectedStory.title}</h1>
            </div>
            <button 
              onClick={togglePlayStory}
              className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-lg hover:bg-white/50 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>

          <div className="px-8 prose prose-stone max-w-none">
            <p className="text-gray-700 leading-[2.0] text-[16px] text-justify whitespace-pre-line first-letter:text-5xl first-letter:text-secondary first-letter:mr-3 first-letter:float-left">
              {selectedStory.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (diaries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-cream px-6 text-center">
        <BookOpen size={56} className="text-yellow-300 mb-6" strokeWidth={1.5} />
        <p className="font-bold text-xl text-gray-800">아직 기록된 이야기가 없어요.</p>
        <p className="text-sm mt-3 text-gray-500">홈에서 오늘의 질문에 답해보세요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-cream pb-20">
      {/* Progress Card - 모든 뷰에서 표시 */}
      <div className="px-6 pt-6 pb-2">
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
            <p className="text-xs text-gray-400">
              한 달의 동화 일기가 모이면 실물 동화책을 배송받을 수 있어요
            </p>
            {progress >= 100 && (
              <button 
                onClick={openBookPreview}
                className="w-full mt-4 bg-secondary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors active:scale-95"
              >
                <ShoppingBag size={16} />
                동화 일기책 만들기
              </button>
            )}
        </div>
      </div>

      {/* 월 필터 */}
      {viewMode === 'grid' && (
        <div className="px-6 pt-2 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
              const monthDiaries = diaries.filter(d => new Date(d.date).getMonth() + 1 === month);
              if (monthDiaries.length === 0 && month !== currentMonth) return null;
              
              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedMonth === month
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-yellow-50'
                  }`}
                >
                  {month}월 ({monthDiaries.length})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 pt-4 pb-2 flex gap-3 items-center justify-end min-h-[58px]">
        {viewMode === 'grid' && (
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-yellow-400 group-focus-within:text-yellow-500 transition-colors" size={20} />
            </div>
            <input
              className="w-full bg-white rounded-full pl-10 pr-4 py-3 text-sm font-bold shadow-sm border border-transparent focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100 transition-all placeholder-yellow-200 text-gray-800"
              placeholder="추억 검색하기..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        
        {viewMode === 'single' && <div className="flex-1"></div>}

        <div className="bg-white p-1.5 rounded-full flex items-center shadow-sm shrink-0 h-[48px] border border-white">
          <button 
            onClick={() => setViewMode('single')}
            className={`w-10 h-full rounded-full flex items-center justify-center transition-all ${
              viewMode === 'single' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <BookOpen size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`w-10 h-full rounded-full flex items-center justify-center transition-all ${
              viewMode === 'grid' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <LayoutGrid size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'single' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
          {/* Date Navigation */}
          <div className="flex justify-center mb-8 px-6 mt-4">
            <div className="bg-white px-8 py-3 rounded-full flex items-center gap-8 shadow-sm">
              <button 
                onClick={handlePrevDay} 
                disabled={currentIndex >= displayDiaries.length - 1}
                className="text-gray-800 hover:text-gray-600 disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={24} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-2 text-gray-800 font-bold text-lg">
                <CalendarIcon size={20} className="text-yellow-400" />
                <span>{formatDate(currentDiary.date)}</span>
              </div>
              <button 
                onClick={handleNextDay} 
                disabled={currentIndex <= 0}
                className="text-gray-800 hover:text-gray-600 disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={24} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="px-6 pb-10">
            {/* Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-yellow-100 text-yellow-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                  Today's Story
                </span>
              </div>
              <h2 className="text-[28px] font-black text-gray-800 leading-tight">
                {currentDiary.title}
              </h2>
            </div>

            {/* Main Image */}
            <div className="bg-white p-3 rounded-[2.5rem] shadow-lg mb-8">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-yellow-50">
                <img 
                  src={currentDiary.mainImageUrl || currentDiary.imageUrl} 
                  alt="Diary cover" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Heart size={12} className="text-red-400 fill-red-400" />
                  <span className="text-[11px] font-bold text-gray-800">
                    {formatDateShort(currentDiary.date)} 기록
                  </span>
                </div>
              </div>
            </div>

            {/* Story Content */}
            <div className="px-2 mb-10">
              <button
                onClick={() => openStorybook(currentDiary)}
                className="w-full text-left"
              >
                <p className="text-gray-700 leading-[1.8] text-lg whitespace-pre-line font-medium">
                  {(currentDiary.babyContent || currentDiary.content).slice(0, 200)}
                  {(currentDiary.babyContent || currentDiary.content).length > 200 && '...'}
                </p>
                {(currentDiary.babyContent || currentDiary.content).length > 200 && (
                  <span className="text-secondary text-sm font-bold mt-2 inline-block">
                    전체보기 →
                  </span>
                )}
              </button>
            </div>

            {/* PHR 타임라인 */}
            {currentDiary.phrSummary && currentDiary.phrSummary.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Today's Activities
                  </h3>
                </div>
                
                <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                  <div className="space-y-4">
                    {currentDiary.phrSummary.map((type, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                          {type === 'SLEEP' && <Moon size={18} className="text-indigo-400" />}
                          {type === 'FEED' && <Utensils size={18} className="text-orange-400" />}
                          {type === 'POOP' && <Baby size={18} className="text-yellow-500" />}
                          {type === 'BATH' && <Droplet size={18} className="text-blue-400" />}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-bold text-gray-800">
                            {type === 'SLEEP' && '수면'}
                            {type === 'FEED' && '수유'}
                            {type === 'POOP' && '배변'}
                            {type === 'BATH' && '목욕'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 원문 보기 */}
            {currentDiary.babyContent && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <FileText size={16} className="text-yellow-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    엄마/아빠의 기록
                  </h3>
                </div>
                
                <div className="bg-yellow-50 rounded-[2rem] p-6 shadow-sm border-2 border-yellow-100">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                    {currentDiary.babyContent}
                  </p>
                </div>
              </div>
            )}

            {/* Voice Timeline */}
            {currentDiary.voiceNotes && currentDiary.voiceNotes.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Volume2 size={16} className="text-yellow-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Voice Timeline
                  </h3>
                </div>
                
                <div className="bg-white rounded-[2rem] p-6 shadow-sm">
                  <div className="space-y-6">
                    {currentDiary.voiceNotes.map((note) => (
                      <div key={note.id} className="relative pl-6 border-l-2 border-yellow-100 last:border-0 pb-1">
                        <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-white border-4 border-yellow-300"></div>
                        <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1 mb-1.5 uppercase tracking-wide">
                          <Clock size={12} />
                          {formatTime(note.timestamp)}
                        </span>
                        <p className="text-gray-800 text-sm leading-6">"{note.transcript}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Gallery */}
            {currentDiary.gallery && currentDiary.gallery.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <ImageIcon size={16} className="text-yellow-400" />
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Today's Gallery
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {currentDiary.gallery.map((imgUrl, idx) => (
                    <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden bg-white shadow-sm border border-white">
                      <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Grid View
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4">
          <div className="grid grid-cols-2 gap-4 pb-24">
            {displayDiaries.map((diary) => (
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
