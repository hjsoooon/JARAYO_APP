
import React, { useState, useMemo } from 'react';
import { PHRRecord, RecordType } from '../types';
// Fixed: Added Soup and X to imports from lucide-react
import { Activity, Moon, Utensils, Baby, Droplet, ChevronLeft, ChevronRight, ExternalLink, Info, Milk, Sparkles, Coffee, Soup, X } from 'lucide-react';
import { AppHeader } from './AppHeader';

interface ReportTabProps {
  records: PHRRecord[];
}

export const ReportTab: React.FC<ReportTabProps> = ({ records }) => {
  const [view, setView] = useState<'DAILY' | 'WEEKLY'>('WEEKLY');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Week calculation
  const weekRange = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, [selectedDate]);

  const daysOfPellette = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekRange.start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekRange]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const rDate = new Date(r.timestamp);
      return rDate >= weekRange.start && rDate <= weekRange.end;
    });
  }, [records, weekRange]);

  const dailyStats = useMemo(() => {
    const today = records.filter(r => new Date(r.timestamp).toDateString() === selectedDate.toDateString());
    const sleep = today.filter(r => r.type === 'SLEEP').reduce((acc, r) => {
        if (!r.endTime) return acc;
        return acc + (new Date(r.endTime).getTime() - new Date(r.timestamp).getTime()) / 3600000;
    }, 0);
    const feeding = today.filter(r => r.type === 'FEED').length;
    const poop = today.filter(r => r.type === 'POOP').length;
    return { sleep: sleep.toFixed(1), feeding, poop };
  }, [records, selectedDate]);

  const renderPatternChart = () => {
    const hours = Array.from({ length: 25 }, (_, i) => i);
    
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-1">
            <button onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 86400000))} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-gray-300" />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weekly Pattern</span>
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <Activity size={14} className="text-secondary" />
                    {weekRange.start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} - {weekRange.end.getDate()}일
                </h3>
            </div>
            <button onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                <ChevronRight size={20} className="text-gray-300" />
            </button>
        </div>

        {/* Legend Icons - Refined to match image */}
        <div className="flex justify-center items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300"><Milk size={18} /></div>
            <div className="w-10 h-10 rounded-full bg-white border border-secondary/30 flex items-center justify-center text-secondary shadow-sm"><Coffee size={18} /></div>
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300"><Soup size={18} /></div>
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300"><Baby size={18} /></div>
            <div className="w-10 h-10 rounded-full bg-white border border-indigo-200 flex items-center justify-center text-indigo-400 shadow-sm"><Moon size={18} /></div>
        </div>

        <div className="text-center text-[10px] text-gray-300 mb-4 font-bold">19개 중 6개 선택됨</div>

        {/* The Grid Chart Area */}
        <div className="relative flex">
            {/* Left Y-axis labels */}
            <div className="w-6 flex flex-col justify-between text-[9px] text-gray-300 font-mono py-1">
                {hours.filter(h => h % 3 === 0).map(h => (
                    <span key={h}>{h.toString().padStart(2, '0')}</span>
                ))}
            </div>

            {/* Main Columns Container */}
            <div className="flex-1 grid grid-cols-7 gap-[2px] min-h-[440px] border-l border-r border-gray-50 mx-1">
                {daysOfPellette.map((day, dayIdx) => {
                    const dayRecords = filteredRecords.filter(r => new Date(r.timestamp).toDateString() === day.toDateString());
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                        <div key={dayIdx} className={`relative rounded-[2px] h-full ${isToday ? 'bg-orange-50/20' : 'bg-gray-50/30'}`}>
                            {/* Horizontal Grid lines helper */}
                            {hours.filter(h => h % 3 === 0).map(h => (
                                <div key={h} className="absolute w-full h-[1px] bg-gray-100/30" style={{ top: `${(h/24)*100}%` }} />
                            ))}

                            {/* Sleep Blocks (Purple/Indigo) */}
                            {dayRecords.filter(r => r.type === 'SLEEP').map(r => {
                                const start = new Date(r.timestamp);
                                const startPos = (start.getHours() + start.getMinutes() / 60) / 24 * 100;
                                let endPos = 100;
                                if (r.endTime) {
                                    const end = new Date(r.endTime);
                                    endPos = (end.getHours() + end.getMinutes() / 60) / 24 * 100;
                                }
                                return (
                                    <div 
                                        key={r.id}
                                        className="absolute left-[2px] right-[2px] bg-[#7c82bc] opacity-90 rounded-[1px] shadow-sm z-0"
                                        style={{ top: `${startPos}%`, height: `${Math.max(1, endPos - startPos)}%` }}
                                    />
                                );
                            })}

                            {/* Feeding Blocks (Yellow/Orange) */}
                            {dayRecords.filter(r => r.type === 'FEED').map(r => {
                                const start = new Date(r.timestamp);
                                const startPos = (start.getHours() + start.getMinutes() / 60) / 24 * 100;
                                // Simple mock for feed duration if not present
                                const height = 2; 
                                return (
                                    <div 
                                        key={r.id}
                                        className="absolute left-[2px] right-[2px] bg-orange-400 rounded-[1px] z-10"
                                        style={{ top: `${startPos}%`, height: `${height}%` }}
                                    />
                                );
                            })}

                            {/* Markers (Poop/Events Icons) */}
                            {dayRecords.filter(r => r.type === 'POOP' || r.type === 'BATH').map(r => {
                                const time = new Date(r.timestamp);
                                const pos = (time.getHours() + time.getMinutes() / 60) / 24 * 100;
                                return (
                                    <div 
                                        key={r.id}
                                        className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 flex items-center justify-center z-20"
                                        style={{ top: `${pos}%` }}
                                    >
                                        <div className={`w-full h-full rounded-full border border-white shadow-sm flex items-center justify-center ${r.type === 'POOP' ? 'bg-[#92400e]' : 'bg-sky-400'}`}>
                                            <div className="w-1 h-1 bg-white/40 rounded-full" />
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Day label */}
                            <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold ${isToday ? 'text-secondary' : 'text-gray-400'}`}>
                                {day.getDate()}일
                            </div>
                        </div>
                    );
                })}
                
                {/* Horizontal Time indicator line (Optional mock for "current time" line) */}
                <div className="absolute w-full h-[1px] bg-red-400/50 z-30 pointer-events-none" style={{ top: '88%' }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 bg-red-400 text-white text-[8px] px-1 rounded-sm font-bold">21:20</div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 bg-red-400 text-white text-[8px] px-1 rounded-sm font-bold">21:20</div>
                </div>
            </div>

            {/* Right Y-axis labels */}
             <div className="w-6 flex flex-col justify-between text-[9px] text-gray-300 font-mono py-1 ml-1 text-right">
                {hours.filter(h => h % 3 === 0).map(h => (
                    <span key={h}>{h.toString().padStart(2, '0')}</span>
                ))}
            </div>
        </div>
        
        <div className="mt-12 text-center py-2.5 px-4 bg-rose-50 rounded-2xl text-[9px] text-rose-500 font-bold flex items-center justify-center gap-1.5 border border-rose-100">
            <X size={12} className="text-rose-300" />
            시간선을 숨기거나 보려면 차트를 터치하세요
            <X size={12} className="text-rose-300" />
        </div>
      </div>
    );
  };

  const renderDailyReport = () => {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Daily Summary</h3>
                    <p className="text-gray-800 font-bold text-lg leading-tight">우리 아이는 오늘<br/><span className="text-secondary">어제보다 1시간 더</span> 잤네요!</p>
                </div>
                <div className="w-20 h-20 bg-primary/20 rounded-[28px] flex items-center justify-center text-4xl shadow-inner border border-yellow-200">
                    🐥
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex flex-col items-center gap-2 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Moon size={22} /></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">수면</span>
                    <span className="text-xl font-bold text-gray-800">{dailyStats.sleep}h</span>
                </div>
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex flex-col items-center gap-2 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><Utensils size={22} /></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">수유</span>
                    <span className="text-xl font-bold text-gray-800">{dailyStats.feeding}회</span>
                </div>
                <div className="bg-white p-5 rounded-[28px] border border-gray-100 flex flex-col items-center gap-2 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center"><Baby size={22} /></div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">배변</span>
                    <span className="text-xl font-bold text-gray-800">{dailyStats.poop}회</span>
                </div>
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity size={18} className="text-indigo-400" />
                        수면 시간 분포
                    </h3>
                    <span className="text-[10px] font-bold text-gray-300">Today</span>
                </div>
                <div className="h-6 bg-gray-50 rounded-full overflow-hidden flex p-1 border border-gray-100">
                    <div className="w-1/4 h-full bg-indigo-400/80 rounded-full mr-1"></div>
                    <div className="w-1/6 h-full bg-gray-100/50 rounded-full mr-1"></div>
                    <div className="w-1/4 h-full bg-indigo-400/80 rounded-full mr-1"></div>
                    <div className="flex-1 h-full bg-gray-100/50 rounded-full mr-1"></div>
                    <div className="w-1/5 h-full bg-indigo-400/80 rounded-full"></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-300 mt-3 font-mono px-1">
                    <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="pb-24 bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
       <AppHeader variant="center" title="분석 리포트" />

       <div className="px-5 pt-4">
       <div className="flex flex-col gap-4 mb-6">
          <div className="bg-gray-100 p-1.5 rounded-[20px] flex text-[13px] font-bold shadow-inner">
             <button 
               onClick={() => setView('DAILY')}
               className={`flex-1 py-2.5 rounded-[14px] transition-all duration-300 ${view === 'DAILY' ? 'bg-white shadow-md text-gray-800' : 'text-gray-400'}`}
             >
               일과표
             </button>
             <button 
               onClick={() => setView('WEEKLY')}
               className={`flex-1 py-2.5 rounded-[14px] transition-all duration-300 ${view === 'WEEKLY' ? 'bg-white shadow-md text-gray-800' : 'text-gray-400'}`}
             >
               주간 패턴
             </button>
             <button 
               className="flex-1 py-2.5 rounded-[14px] text-gray-300 cursor-not-allowed flex items-center justify-center gap-1"
             >
               간격 <span className="text-[8px] bg-gray-200 px-1 rounded text-gray-400">Beta</span>
             </button>
          </div>
       </div>

       {view === 'WEEKLY' ? renderPatternChart() : renderDailyReport()}

       {/* Professional Content Card */}
       <a 
         href="https://babting.github.io/K-DST-helper/"
         target="_blank"
         rel="noreferrer"
         className="mt-8 block bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-[32px] mb-4 border border-blue-200/50 shadow-sm group active:scale-[0.98] transition-all"
       >
         <div className="flex justify-between items-start">
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-2">
                 <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <Sparkles size={16} className="text-blue-500" />
                 </div>
                 <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Growth Guide</span>
               </div>
               <h3 className="font-bold text-blue-900 text-lg mb-1">발달 선별 검사 (K-DST)</h3>
               <p className="text-xs text-blue-600/80 mb-4 leading-relaxed">우리 아이 발달 상태가 궁금하시죠?<br/>월령별 공식 가이드로 체크해보세요.</p>
               <span className="text-[11px] bg-white text-blue-600 px-4 py-1.5 rounded-full font-bold shadow-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  지금 검사하기 <ChevronRight size={12} />
               </span>
            </div>
            <ExternalLink className="text-blue-300" size={20} />
         </div>
       </a>
    </div>
    </div>
  );
};
