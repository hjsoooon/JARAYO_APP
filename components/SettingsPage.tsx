import React, { useState, useRef } from 'react';
import { BabyProfile, Gender } from '../types';
import { 
  ChevronLeft, ChevronRight, Camera, UserCircle, Phone, Calendar, 
  Baby, Users, UserPlus, LogOut, Trash2, PencilLine, ImagePlus
} from 'lucide-react';

interface SettingsPageProps {
  profile: BabyProfile;
  onBack: () => void;
  onUpdateProfile: (updates: Partial<BabyProfile>) => void;
  onLogout: () => void;
}

type SettingsView = 'main' | 'editName' | 'editPhone' | 'editBirth' | 'editGender' | 'coParent' | 'addChild';

export const SettingsPage: React.FC<SettingsPageProps> = ({ profile, onBack, onUpdateProfile, onLogout }) => {
  const [view, setView] = useState<SettingsView>('main');
  const [editValue, setEditValue] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showToast, setShowToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const babyFileInputRef = useRef<HTMLInputElement>(null);

  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 2000);
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 프로필 사진 변경 (데모: 알림만)
    toast('프로필 사진이 업데이트되었습니다');
  };

  const handleBabyPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateProfile({ photoUrl: event.target.result as string });
          toast('아이 사진이 업데이트되었습니다');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 서브 헤더
  const SubHeader = ({ title, onBack: onSubBack }: { title: string; onBack: () => void }) => (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-orange-100 shadow-sm px-5 pt-4 pb-3">
      <div className="flex items-center">
        <button 
          onClick={onSubBack}
          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors mr-3"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-800">{title}</h1>
      </div>
    </header>
  );

  // 이름 수정 화면
  if (view === 'editName') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <SubHeader title="이름 수정" onBack={() => setView('main')} />
        <div className="flex-1 px-5 py-6">
          <label className="block text-sm font-bold text-gray-500 mb-2">아이 이름</label>
          <input 
            type="text"
            value={editValue || profile.name}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3.5 text-base font-medium border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
            placeholder="이름을 입력하세요"
            autoFocus
          />
          <button 
            onClick={() => {
              if (editValue.trim()) {
                onUpdateProfile({ name: editValue.trim() });
                toast('이름이 수정되었습니다');
                setView('main');
                setEditValue('');
              }
            }}
            className="w-full mt-6 bg-amber-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-transform"
          >
            저장하기
          </button>
        </div>
      </div>
    );
  }

  // 전화번호 수정 화면
  if (view === 'editPhone') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <SubHeader title="전화번호 수정" onBack={() => setView('main')} />
        <div className="flex-1 px-5 py-6">
          <label className="block text-sm font-bold text-gray-500 mb-2">전화번호</label>
          <input 
            type="tel"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3.5 text-base font-medium border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
            placeholder="010-0000-0000"
            autoFocus
          />
          <button 
            onClick={() => { toast('전화번호가 수정되었습니다'); setView('main'); setEditValue(''); }}
            className="w-full mt-6 bg-amber-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-transform"
          >
            저장하기
          </button>
        </div>
      </div>
    );
  }

  // 생년월일 수정 화면
  if (view === 'editBirth') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <SubHeader title="생년월일 수정" onBack={() => setView('main')} />
        <div className="flex-1 px-5 py-6">
          <label className="block text-sm font-bold text-gray-500 mb-2">아이 생년월일</label>
          <input 
            type="date"
            value={editValue || profile.birthDate}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-white rounded-xl px-4 py-3.5 text-base font-medium border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
            autoFocus
          />
          <button 
            onClick={() => {
              if (editValue) {
                onUpdateProfile({ birthDate: editValue });
                toast('생년월일이 수정되었습니다');
                setView('main');
                setEditValue('');
              }
            }}
            className="w-full mt-6 bg-amber-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-transform"
          >
            저장하기
          </button>
        </div>
      </div>
    );
  }

  // 성별 수정 화면
  if (view === 'editGender') {
    const genderOptions: { value: Gender; label: string; emoji: string }[] = [
      { value: 'BOY', label: '남아', emoji: '👦' },
      { value: 'GIRL', label: '여아', emoji: '👧' },
      { value: 'OTHER', label: '기타', emoji: '👶' },
    ];
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <SubHeader title="성별 수정" onBack={() => setView('main')} />
        <div className="flex-1 px-5 py-6">
          <label className="block text-sm font-bold text-gray-500 mb-3">아이 성별</label>
          <div className="flex gap-3">
            {genderOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onUpdateProfile({ gender: opt.value });
                  toast('성별이 수정되었습니다');
                  setView('main');
                }}
                className={`flex-1 py-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center gap-2 ${
                  profile.gender === opt.value
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-gray-100 bg-white text-gray-400'
                }`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 공동 육아자 초대 화면
  if (view === 'coParent') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <SubHeader title="공동 육아자 초대" onBack={() => setView('main')} />
        <div className="flex-1 px-5 py-6">
          {/* 초대 안내 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                <Users size={24} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">함께 육아하기</h3>
                <p className="text-xs text-gray-400">배우자, 조부모님을 초대하세요</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              초대 링크를 공유하면 공동 육아자가 아이의 기록을 함께 확인하고 기록할 수 있어요.
            </p>
            <button 
              onClick={() => toast('초대 링크가 복사되었습니다')}
              className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              초대 링크 복사하기
            </button>
          </div>

          {/* 현재 공동 육아자 목록 (데모) */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3">참여 중인 육아자</h3>
            <div className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <UserCircle size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">나 (관리자)</p>
                <p className="text-xs text-gray-400">현재 사용 중</p>
              </div>
            </div>
          </div>

          {/* 아이 추가 */}
          <button 
            onClick={() => setView('addChild')}
            className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <Baby size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-800">아이 추가</p>
              <p className="text-xs text-gray-400">둘째, 셋째 아이를 등록하세요</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        </div>
      </div>
    );
  }

  // 아이 추가 화면
  if (view === 'addChild') {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
        <SubHeader title="아이 추가" onBack={() => setView('coParent')} />
        <div className="flex-1 px-5 py-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-3 border-2 border-dashed border-amber-200">
                <Baby size={32} className="text-amber-400" />
              </div>
              <p className="text-sm text-gray-500">새로운 아이 정보를 입력해주세요</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">이름</label>
                <input 
                  type="text"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  placeholder="아이 이름"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">생년월일</label>
                <input 
                  type="date"
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2">성별</label>
                <div className="flex gap-3">
                  {[
                    { v: 'BOY', l: '남아', e: '👦' },
                    { v: 'GIRL', l: '여아', e: '👧' },
                  ].map((o) => (
                    <button key={o.v} className="flex-1 py-3 rounded-xl border-2 border-gray-100 bg-white text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-amber-300 transition-colors">
                      <span>{o.e}</span> <span className="text-sm">{o.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => { toast('아이가 추가되었습니다 (데모)'); setView('coParent'); }}
              className="w-full mt-6 bg-amber-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] transition-transform"
            >
              추가하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 메인 설정 화면
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#FFF9E6] to-[#FFF4D9]">
      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
      <input type="file" ref={babyFileInputRef} accept="image/*" className="hidden" onChange={handleBabyPhotoChange} />

      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-orange-100 shadow-sm px-5 pt-4 pb-3">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors mr-3"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-800">설정</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* ===== 프로필 수정 섹션 ===== */}
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">프로필 수정</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* 프로필 사진 */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <ImagePlus size={18} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">사진 업데이트</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>

            {/* 이름 수정 */}
            <button 
              onClick={() => { setEditValue(profile.name); setView('editName'); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <PencilLine size={18} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-700">이름 수정</span>
                <span className="text-xs text-gray-400 ml-2">{profile.name}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>

            {/* 전화번호 수정 */}
            <button 
              onClick={() => { setEditValue(''); setView('editPhone'); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Phone size={18} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">전화번호 수정</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>

            {/* 생년월일 수정 */}
            <button 
              onClick={() => { setEditValue(profile.birthDate); setView('editBirth'); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Calendar size={18} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-700">생년월일 수정</span>
                <span className="text-xs text-gray-400 ml-2">{profile.birthDate}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>

            {/* 성별 수정 */}
            <button 
              onClick={() => setView('editGender')}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                <Baby size={18} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-700">성별 수정</span>
                <span className="text-xs text-gray-400 ml-2">
                  {profile.gender === 'BOY' ? '남아' : profile.gender === 'GIRL' ? '여아' : '기타'}
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          </div>
        </div>

        {/* ===== 아이 관리 섹션 ===== */}
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">아이 관리</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* 아이 사진 업데이트 */}
            <button 
              onClick={() => babyFileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                <Camera size={18} />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-700">아이 사진 업데이트</span>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 mr-1">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Baby size={16} />
                  </div>
                )}
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>

            {/* 공동 육아자 초대 */}
            <button 
              onClick={() => setView('coParent')}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                <Users size={18} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">공동 육아자 초대</span>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          </div>
        </div>

        {/* ===== 계정 섹션 ===== */}
        <div className="px-5 pt-5 pb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">계정</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* 로그아웃 */}
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <LogOut size={18} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-500 text-left">로그아웃</span>
            </button>

            {/* 회원탈퇴 */}
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                <Trash2 size={18} />
              </div>
              <span className="flex-1 text-sm font-medium text-red-400 text-left">회원탈퇴</span>
            </button>
          </div>
        </div>

        {/* 앱 버전 */}
        <div className="text-center pb-8">
          <p className="text-xs text-gray-300">JARAYO v1.0.0</p>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">로그아웃</h3>
            <p className="text-sm text-gray-500 mb-6">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm"
              >
                취소
              </button>
              <button 
                onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm active:scale-[0.98] transition-transform"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 mx-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-red-600 mb-2">회원탈퇴</h3>
            <p className="text-sm text-gray-500 mb-2">정말 탈퇴하시겠습니까?</p>
            <p className="text-xs text-red-400 mb-6">모든 데이터가 삭제되며 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm"
              >
                취소
              </button>
              <button 
                onClick={() => { setShowDeleteConfirm(false); onLogout(); }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm active:scale-[0.98] transition-transform"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg animate-[fadeIn_0.3s_ease]">
          {showToast}
        </div>
      )}
    </div>
  );
};
