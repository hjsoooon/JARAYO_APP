import React, { useState, useRef, useMemo } from 'react';
import { DiaryEntry } from '../types';
import { Search, BookOpen, LayoutGrid, ChevronLeft, ChevronRight, Heart, Clock, Image as ImageIcon, Plus, Calendar as CalendarIcon, Loader2, Play, Pause } from 'lucide-react';

interface DiaryTabProps {
  diaries: DiaryEntry[];
}

type ViewMode = 'grid' | 'single' | 'storybook';

export const DiaryTab: React.FC<DiaryTabProps> = ({ diaries }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStory, setSelectedStory] = useState<DiaryEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 검색 필터링
  const filteredDiaries = useMemo(() => {
    return diaries.filter(diary => 
      diary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (diary.babyContent || diary.content).toLowerCase().includes(searchQuery.toLowerCase()) ||
      diary.date.includes(searchQuery)
    );
  }, [diaries, searchQuery]);

  const displayDiaries = viewMode === 'grid' ? filteredDiaries : diaries;
  const currentDiary = displayDiaries[currentIndex];

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

            {/* Voice Timeline */}
            {currentDiary.voiceNotes && currentDiary.voiceNotes.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
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
                  <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
                    {diary.babyContent || diary.content}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
