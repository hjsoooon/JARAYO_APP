import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { HomeTab } from './components/HomeTab';
import { DiaryTab } from './components/DiaryTab';
import { ChatTab } from './components/ChatTab';
import { ReportTab } from './components/ReportTab';
import { PHRModal } from './components/PHRModal';
import { BabyProfile, PHRRecord, RecordType, DiaryEntry } from './types';
import { generateDiaryEntry } from './services/geminiService';

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
  }, []);

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
    
    const phrSummary = records
      .slice(0, 5)
      .map(r => `${r.type}: ${r.value || ''}`)
      .join(', ');
      
    const aiStory = await generateDiaryEntry(profile.name, text, phrSummary);
    
    const newDiary: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      title: `${profile.name}의 모험`,
      content: aiStory,
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