
import React, { useState, useMemo } from 'react';
import { PHRRecord, RecordType, GrowthRecord, BabyProfile } from '../types';
import { Activity, Moon, Utensils, Baby, Droplet, ChevronLeft, ChevronRight, ExternalLink, Info, Milk, Sparkles, Coffee, Soup, X, Ruler, Weight, CircleDot, Save, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AppHeader } from './AppHeader';
import { WHO_GROWTH, getPercentileRange, getAgeMonths, PercentileRow } from '../data/growthStandards';

interface ReportTabProps {
  records: PHRRecord[];
  growthRecords: GrowthRecord[];
  onSaveGrowth: (record: GrowthRecord) => void;
  profile: BabyProfile;
}

export const ReportTab: React.FC<ReportTabProps> = ({ records, growthRecords, onSaveGrowth, profile }) => {
  const [view, setView] = useState<'GROWTH' | 'WEEKLY'>('GROWTH');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Growth form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  // Load existing record for selected date
  const existingRecord = useMemo(() => {
    return growthRecords.find(r => r.date === selectedDateStr);
  }, [growthRecords, selectedDateStr]);

  // Sync form when date changes
  React.useEffect(() => {
    if (existingRecord) {
      setHeight(existingRecord.height?.toString() || '');
      setWeight(existingRecord.weight?.toString() || '');
      setHeadCircumference(existingRecord.headCircumference?.toString() || '');
    } else {
      setHeight('');
      setWeight('');
      setHeadCircumference('');
    }
  }, [existingRecord, selectedDateStr]);

  const handleGrowthDateChange = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const handleSave = () => {
    const h = height ? parseFloat(height) : undefined;
    const w = weight ? parseFloat(weight) : undefined;
    const hc = headCircumference ? parseFloat(headCircumference) : undefined;
    if (!h && !w && !hc) return;
    onSaveGrowth({
      id: selectedDateStr,
      date: selectedDateStr,
      height: h,
      weight: w,
      headCircumference: hc,
    });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  };

  // Gender-specific WHO data
  const genderKey = profile.gender === 'GIRL' ? 'GIRL' : 'BOY';
  const whoData = WHO_GROWTH[genderKey];

  // Baby age in months
  const ageMonths = useMemo(() => {
    const birth = new Date(profile.birthDate);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
  }, [profile.birthDate]);

  // Max month range for charts (current age + 3, min 12)
  const chartMaxMonth = Math.max(12, Math.min(36, ageMonths + 3));

  // Build chart data: WHO percentile bands + user measurements
  const buildChartData = (
    whoSeries: PercentileRow[],
    userKey: 'height' | 'weight' | 'headCircumference'
  ) => {
    const userPoints = growthRecords
      .filter(r => r[userKey] != null)
      .map(r => ({
        month: Math.round(getAgeMonths(profile.birthDate, r.date) * 10) / 10,
        value: r[userKey]!,
      }));

    return whoSeries
      .filter(row => row.month <= chartMaxMonth)
      .map(row => {
        const userMatch = userPoints.find(u => Math.abs(u.month - row.month) < 0.5);
        return {
          month: row.month,
          p3: row.p3,
          p15: row.p15,
          p50: row.p50,
          p85: row.p85,
          p97: row.p97,
          myValue: userMatch?.value ?? null,
        };
      });
  };

  // Get latest percentile info
  const getLatestPercentile = (
    whoSeries: PercentileRow[],
    userKey: 'height' | 'weight' | 'headCircumference'
  ): string | null => {
    const sorted = [...growthRecords].filter(r => r[userKey] != null).sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return null;
    const latest = sorted[0];
    const monthAge = Math.round(getAgeMonths(profile.birthDate, latest.date));
    const row = whoSeries.find(r => r.month === monthAge);
    if (!row) return null;
    return getPercentileRange(latest[userKey]!, row);
  };

  // Week calculation for weekly pattern
  const weekRange = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

  const renderGrowthTab = () => {
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const hasData = height || weight || headCircumference;

    return (
      <div className="space-y-5">
        {/* Date Selector */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between">
            <button onClick={() => handleGrowthDateChange(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronLeft size={18} className="text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-secondary" />
              <span className="font-bold text-gray-800 text-sm">
                {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              {isToday && <span className="text-[9px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold">오늘</span>}
            </div>
            <button
              onClick={() => handleGrowthDateChange(1)}
              disabled={isToday}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-30"
            >
              <ChevronRight size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 space-y-4">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">측정 기록</h4>

          <div className="space-y-3">
            {/* Height */}
            <div className="flex items-center gap-3 bg-blue-50/50 rounded-2xl p-3.5 border border-blue-100/50">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-lg">📏</span>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">키 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="예: 65.5"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="flex items-center gap-3 bg-orange-50/50 rounded-2xl p-3.5 border border-orange-100/50">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <span className="text-lg">⚖️</span>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">몸무게 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="예: 7.2"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
            </div>

            {/* Head Circumference */}
            <div className="flex items-center gap-3 bg-green-50/50 rounded-2xl p-3.5 border border-green-100/50">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-lg">🧠</span>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">머리둘레 (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="예: 42.0"
                  value={headCircumference}
                  onChange={e => setHeadCircumference(e.target.value)}
                  className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasData}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
              hasData
                ? 'bg-secondary text-white shadow-md'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            {showSaved ? (
              <>저장 완료!</>
            ) : (
              <>{existingRecord ? '수정하기' : '저장하기'}</>
            )}
          </button>
        </div>

        {/* Growth Charts with WHO Percentile Bands */}
        {[
          { key: 'height' as const, whoKey: 'height' as const, label: '📏 키 (cm)', color: '#60A5FA', bandLight: 'rgba(96,165,250,0.08)', bandMid: 'rgba(96,165,250,0.15)' },
          { key: 'weight' as const, whoKey: 'weight' as const, label: '⚖️ 몸무게 (kg)', color: '#FB923C', bandLight: 'rgba(251,146,60,0.08)', bandMid: 'rgba(251,146,60,0.15)' },
          { key: 'headCircumference' as const, whoKey: 'head' as const, label: '🧠 머리둘레 (cm)', color: '#4ADE80', bandLight: 'rgba(74,222,128,0.08)', bandMid: 'rgba(74,222,128,0.15)' },
        ].map(({ key, whoKey, label, color, bandLight, bandMid }) => {
          const data = buildChartData(whoData[whoKey], key);
          const percentile = getLatestPercentile(whoData[whoKey], key);

          return (
            <div key={key} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold mb-0 flex items-center gap-1" style={{ color }}>{label}</p>
                {percentile && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: bandMid, color }}>
                    {percentile} 백분위
                  </span>
                )}
              </div>

              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 9, fill: '#bbb' }}
                      label={{ value: '개월', position: 'insideBottomRight', offset: -5, fontSize: 9, fill: '#ccc' }}
                    />
                    <YAxis tick={{ fontSize: 9, fill: '#bbb' }} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        const labels: Record<string, string> = { p3: '3rd', p15: '15th', p50: '50th', p85: '85th', p97: '97th', myValue: '우리 아이' };
                        return [value != null ? value : '-', labels[name] || name];
                      }}
                      labelFormatter={(month) => `${month}개월`}
                    />

                    {/* Percentile lines */}
                    <Line type="monotone" dataKey="p3" stroke={color} strokeWidth={0.8} strokeOpacity={0.2} dot={false} name="p3" />
                    <Line type="monotone" dataKey="p15" stroke={color} strokeWidth={0.8} strokeOpacity={0.25} dot={false} name="p15" />
                    <Line type="monotone" dataKey="p50" stroke={color} strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.5} dot={false} name="p50" />
                    <Line type="monotone" dataKey="p85" stroke={color} strokeWidth={0.8} strokeOpacity={0.25} dot={false} name="p85" />
                    <Line type="monotone" dataKey="p97" stroke={color} strokeWidth={0.8} strokeOpacity={0.2} dot={false} name="p97" />

                    {/* My baby's data */}
                    <Line type="monotone" dataKey="myValue" stroke={color} strokeWidth={3} dot={{ r: 5, fill: color, stroke: 'white', strokeWidth: 2 }} connectNulls name="myValue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Percentile legend */}
              <div className="flex justify-center gap-4 mt-2 text-[9px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{ background: bandMid }}></span>15th~85th</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm" style={{ background: bandLight }}></span>3rd~97th</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0 border-t border-dashed" style={{ borderColor: color }}></span>50th</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: color }}></span>우리 아이</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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

        {/* Legend */}
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
            <div className="w-6 flex flex-col justify-between text-[9px] text-gray-300 font-mono py-1">
                {hours.filter(h => h % 3 === 0).map(h => (
                    <span key={h}>{h.toString().padStart(2, '0')}</span>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-7 gap-[2px] min-h-[440px] border-l border-r border-gray-50 mx-1">
                {daysOfPellette.map((day, dayIdx) => {
                    const dayRecords = filteredRecords.filter(r => new Date(r.timestamp).toDateString() === day.toDateString());
                    const isToday = day.toDateString() === new Date().toDateString();

                    return (
                        <div key={dayIdx} className={`relative rounded-[2px] h-full ${isToday ? 'bg-orange-50/20' : 'bg-gray-50/30'}`}>
                            {hours.filter(h => h % 3 === 0).map(h => (
                                <div key={h} className="absolute w-full h-[1px] bg-gray-100/30" style={{ top: `${(h/24)*100}%` }} />
                            ))}

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

                            {dayRecords.filter(r => r.type === 'FEED').map(r => {
                                const start = new Date(r.timestamp);
                                const startPos = (start.getHours() + start.getMinutes() / 60) / 24 * 100;
                                const height = 2;
                                return (
                                    <div
                                        key={r.id}
                                        className="absolute left-[2px] right-[2px] bg-orange-400 rounded-[1px] z-10"
                                        style={{ top: `${startPos}%`, height: `${height}%` }}
                                    />
                                );
                            })}

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

                            <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold ${isToday ? 'text-secondary' : 'text-gray-400'}`}>
                                {day.getDate()}일
                            </div>
                        </div>
                    );
                })}
            </div>

             <div className="w-6 flex flex-col justify-between text-[9px] text-gray-300 font-mono py-1 ml-1 text-right">
                {hours.filter(h => h % 3 === 0).map(h => (
                    <span key={h}>{h.toString().padStart(2, '0')}</span>
                ))}
            </div>
        </div>
        <div className="pb-4" />
      </div>
    );
  };

  return (
    <div className="pb-4 bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
       <AppHeader variant="center" title="성장 리포트" />

       <div className="px-5 pt-4">
       <div className="flex flex-col gap-4 mb-6">
          <div className="bg-gray-100 p-1.5 rounded-[20px] flex text-[13px] font-bold shadow-inner">
             <button
               onClick={() => setView('GROWTH')}
               className={`flex-1 py-2.5 rounded-[14px] transition-all duration-300 ${view === 'GROWTH' ? 'bg-white shadow-md text-gray-800' : 'text-gray-400'}`}
             >
               발달
             </button>
             <button
               onClick={() => setView('WEEKLY')}
               className={`flex-1 py-2.5 rounded-[14px] transition-all duration-300 ${view === 'WEEKLY' ? 'bg-white shadow-md text-gray-800' : 'text-gray-400'}`}
             >
               주간 패턴
             </button>
          </div>
       </div>

       {view === 'GROWTH' ? renderGrowthTab() : renderPatternChart()}

       {/* K-DST Link */}
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
