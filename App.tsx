import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding.tsx';
import { Layout } from './components/Layout.tsx';
import { HomeTab } from './components/HomeTab.tsx';
import { DiaryTab } from './components/DiaryTab.tsx';
import { ChatTab } from './components/ChatTab.tsx';
import { ReportTab } from './components/ReportTab.tsx';
import { PHRModal } from './components/PHRModal.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { BabyProfile, PHRRecord, RecordType, DiaryEntry, GrowthRecord } from './types.ts';
import { generateDiaryEntry } from './services/geminiService.ts';

const BASE = '/JARAYO_APP/';
const getStorybookImage = (phrTypes: string[], content: string): string => {
  const text = content.toLowerCase();
  if (phrTypes.includes('SLEEP') || text.includes('잠') || text.includes('자') || text.includes('꿈')) return `${BASE}storybook/sleeping.png`;
  if (phrTypes.includes('FEED') || text.includes('밥') || text.includes('먹') || text.includes('수유') || text.includes('이유식')) return `${BASE}storybook/feeding.png`;
  if (phrTypes.includes('BATH') || text.includes('목욕') || text.includes('씻') || text.includes('물놀이')) return `${BASE}storybook/bathing.png`;
  if (text.includes('놀') || text.includes('장난감') || text.includes('웃')) return `${BASE}storybook/playing.png`;
  return `${BASE}storybook/morning.png`;
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [records, setRecords] = useState<PHRRecord[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);

  // Modal State
  const [isPHRModalOpen, setIsPHRModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [activeRecord, setActiveRecord] = useState<Partial<PHRRecord> | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('jarayo_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    const savedRecords = localStorage.getItem('jarayo_records');
    if (savedRecords) {
      setRecords(JSON.parse(savedRecords));
    }
    const savedDiaries = localStorage.getItem('jarayo_diaries');
    if (savedDiaries) {
      setDiaries(JSON.parse(savedDiaries));
    }
    const savedGrowth = localStorage.getItem('jarayo_growth');
    if (savedGrowth) {
      setGrowthRecords(JSON.parse(savedGrowth));
    }
  }, []);

  // Save diaries to localStorage whenever they change
  useEffect(() => {
    if (diaries.length > 0) {
      localStorage.setItem('jarayo_diaries', JSON.stringify(diaries));
    }
  }, [diaries]);

  const handleOnboardingComplete = (newProfile: BabyProfile) => {
    setProfile(newProfile);
    localStorage.setItem('jarayo_profile', JSON.stringify(newProfile));
  };

  const handleUpdateProfile = (updates: Partial<BabyProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    localStorage.setItem('jarayo_profile', JSON.stringify(newProfile));
  };

  const handleLogout = () => {
    localStorage.removeItem('jarayo_profile');
    localStorage.removeItem('jarayo_records');
    localStorage.removeItem('jarayo_diaries');
    setProfile(null);
    setRecords([]);
    setDiaries([]);
    setShowSettings(false);
    setActiveTab('home');
  };

  const handleQuickAdd = (type: RecordType, subtype?: string, value?: string) => {
    const newRecord: PHRRecord = {
        id: Date.now().toString(),
        type,
        subtype,
        timestamp: new Date().toISOString(),
        value: value || (type === 'SLEEP' ? '수면 시작' : type === 'BATH' ? '목욕 시작' : undefined),
    };
    saveRecord(newRecord);
  };

  const handleSaveGrowth = (record: GrowthRecord) => {
    const updated = [...growthRecords.filter(r => r.date !== record.date), record].sort((a, b) => a.date.localeCompare(b.date));
    setGrowthRecords(updated);
    localStorage.setItem('jarayo_growth', JSON.stringify(updated));
  };

  const handleOpenTimer = () => {
      setActiveRecord({
          type: 'FEED',
          subtype: 'BREAST',
          timestamp: new Date().toISOString(),
      });
      setModalMode('CREATE');
      setIsPHRModalOpen(true);
  };

  const handleEditRecord = (record: PHRRecord) => {
      setActiveRecord(record);
      setModalMode('EDIT');
      setIsPHRModalOpen(true);
  };

  const saveRecord = (record: PHRRecord) => {
    const existingIndex = records.findIndex(r => r.id === record.id);
    let updatedRecords;
    if (existingIndex >= 0) {
        updatedRecords = [...records];
        updatedRecords[existingIndex] = record;
    } else {
        updatedRecords = [record, ...records];
    }
    setRecords(updatedRecords);
    localStorage.setItem('jarayo_records', JSON.stringify(updatedRecords));
  };

  const handleModalSave = (data: Partial<PHRRecord>) => {
      const id = data.id || Date.now().toString();
      const recordToSave: PHRRecord = {
          id,
          type: data.type as RecordType,
          timestamp: data.timestamp || new Date().toISOString(),
          endTime: data.endTime,
          subtype: data.subtype,
          value: data.value,
          memo: data.memo,
      };
      saveRecord(recordToSave);
  };

  const handleGenerateDiary = async (text: string) => {
    if (!profile) return;
    
    // 오늘 날짜의 PHR 기록 가져오기
    const today = new Date().toDateString();
    const todayRecords = records.filter(r => new Date(r.timestamp).toDateString() === today);
    
    // PHR 요약 텍스트
    const phrSummary = todayRecords
      .slice(0, 5)
      .map(r => `${r.type}: ${r.value || ''}`)
      .join(', ');
    
    // PHR 타입 배열 (중복 제거)
    const phrTypes = [...new Set(todayRecords.map(r => r.type))];
      
    // AI 동화 생성
    const aiStory = await generateDiaryEntry(profile.name, text, phrSummary);
    
    // 아기 나이 계산 (주 단위)
    const birthDate = new Date(profile.birthDate);
    const ageWeeks = Math.floor((Date.now() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    const newDiary: DiaryEntry = {
      id: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
      date: new Date().toISOString(),
      title: `${profile.name}의 하루`,
      content: aiStory,
      babyContent: text, // 원본 부모 입력
      mainImageUrl: getStorybookImage(phrTypes, aiStory),
      imageUrl: getStorybookImage(phrTypes, aiStory),
      mood: 'happy',
      voiceNotes: [], // 추후 음성 녹음 기능 추가 시 사용
      gallery: [], // 추후 갤러리 기능 추가 시 사용
      babyAgeWeeks: ageWeeks,
      phrSummary: phrTypes, // PHR 아이콘 표시용
    };

    setDiaries([newDiary, ...diaries]);
    setActiveTab('diary');
  };

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab 
            profile={profile} 
            records={records} 
            onQuickAdd={handleQuickAdd}
            onOpenTimer={handleOpenTimer}
            onEditRecord={handleEditRecord}
            onGenerateDiary={handleGenerateDiary}
            onUpdateProfile={handleUpdateProfile}
            onOpenSettings={() => setShowSettings(true)}
            onGoToReport={(date) => {
                setActiveTab('report');
            }}
          />
        );
      case 'diary':
        return <DiaryTab diaries={diaries} />;
      case 'chat':
        return <ChatTab />;
      case 'report':
        return <ReportTab records={records} growthRecords={growthRecords} onSaveGrowth={handleSaveGrowth} profile={profile!} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>

      {/* 설정 페이지 (풀스크린 오버레이) */}
      {showSettings && profile && (
        <div className="fixed inset-0 z-[80] max-w-md mx-auto">
          <SettingsPage 
            profile={profile}
            onBack={() => setShowSettings(false)}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        </div>
      )}

      <PHRModal 
        isOpen={isPHRModalOpen}
        onClose={() => setIsPHRModalOpen(false)}
        record={activeRecord}
        mode={modalMode}
        onSave={handleModalSave}
      />
    </>
  );
};

export default App;