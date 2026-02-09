import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding.tsx';
import { Layout } from './components/Layout.tsx';
import { HomeTab } from './components/HomeTab.tsx';
import { DiaryTab } from './components/DiaryTab.tsx';
import { ChatTab } from './components/ChatTab.tsx';
import { ReportTab } from './components/ReportTab.tsx';
import { PHRModal } from './components/PHRModal.tsx';
import { BabyProfile, PHRRecord, RecordType, DiaryEntry } from './types.ts';
import { generateDiaryEntry } from './services/geminiService.ts';

const App: React.FC = () => {
  const [profile, setProfile] = useState<BabyProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [records, setRecords] = useState<PHRRecord[]>([]);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  
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

  const handleQuickAdd = (type: RecordType, subtype?: string) => {
    const newRecord: PHRRecord = {
        id: Date.now().toString(),
        type,
        subtype,
        timestamp: new Date().toISOString(),
        value: type === 'SLEEP' ? '수면 시작' : type === 'BATH' ? '목욕 시작' : undefined, 
    };
    saveRecord(newRecord);
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
    
    // PHR 요약
    const phrSummary = todayRecords
      .slice(0, 5)
      .map(r => `${r.type}: ${r.value || ''}`)
      .join(', ');
      
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
      mainImageUrl: profile.photoUrl, // 캐릭터 이미지
      imageUrl: profile.photoUrl,
      mood: 'happy',
      voiceNotes: [], // 추후 음성 녹음 기능 추가 시 사용
      gallery: [], // 추후 갤러리 기능 추가 시 사용
      babyAgeWeeks: ageWeeks,
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
        return <ReportTab records={records} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </Layout>

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