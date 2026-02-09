import React from 'react';
import { DiaryEntry } from '../types';
import { ChevronRight, PlayCircle, ShoppingBag } from 'lucide-react';

interface DiaryTabProps {
  diaries: DiaryEntry[];
}

export const DiaryTab: React.FC<DiaryTabProps> = ({ diaries }) => {
  const currentMonth = new Date().getMonth() + 1;
  const progress = Math.min((diaries.length / 10) * 100, 100); // 10 entries for 100% just for demo

  return (
    <div className="p-6 pb-20">
      <h1 className="font-cute text-2xl text-yellow-900 mb-6">나의 동화 일기</h1>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-yellow-100 mb-8">
         <div className="flex justify-between items-end mb-2">
            <span className="font-bold text-gray-700">{currentMonth}월 동화책 완성도</span>
            <span className="text-2xl font-bold text-secondary">{Math.floor(progress)}%</span>
         </div>
         <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
         </div>
         <p className="text-xs text-gray-400">
           일기가 10개 모이면 실물 동화책을 만들 수 있어요!
         </p>
         {progress >= 10 && (
            <button className="w-full mt-4 bg-secondary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 animate-bounce">
               <ShoppingBag size={16} />
               동화책 주문하러 가기
            </button>
         )}
      </div>

      {/* Diary List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">지난 이야기</h2>
        
        {diaries.length === 0 ? (
           <div className="text-center py-10 opacity-50">
              <p>아직 만들어진 동화가 없어요.</p>
              <p className="text-sm mt-2">홈에서 아이에게 답장을 보내보세요!</p>
           </div>
        ) : (
           diaries.map((diary) => (
             <div key={diary.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-yellow-200">
                <div className="w-20 h-20 bg-cream rounded-xl flex-shrink-0 overflow-hidden relative">
                   {/* Placeholder for diary image */}
                   <img src={`https://picsum.photos/seed/${diary.id}/200`} alt="Diary" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{diary.date}</span>
                      {diary.isAudio && <PlayCircle size={16} className="text-secondary" />}
                   </div>
                   <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{diary.title}</h3>
                   <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {diary.content}
                   </p>
                </div>
                <div className="flex items-center text-gray-300">
                   <ChevronRight size={20} />
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
};
