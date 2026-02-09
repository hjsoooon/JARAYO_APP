import React, { useState } from 'react';
import { BabyProfile, Gender } from '../types';
import { Baby, Calendar, User, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: BabyProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('BOY');
  const [birthDate, setBirthDate] = useState('');

  const handleNext = () => {
    if (step === 1 && name) setStep(2);
    else if (step === 2 && birthDate) {
      onComplete({
        name,
        gender,
        birthDate,
        hasCharacter: false
      });
    }
  };

  return (
    <div className="h-screen bg-cream flex flex-col justify-center px-8 max-w-md mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-cute text-yellow-500 mb-2">JARAYO</h1>
        <p className="text-gray-500">기록이 동화가 되는 우리 아이 육아</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-lg border border-yellow-100 transition-all duration-500">
        {step === 1 ? (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800">
              반가워요!<br/>
              아기의 <span className="text-secondary">이름</span>은 무엇인가요?
            </h2>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="태명이나 이름을 입력해주세요"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-lg"
              />
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-gray-500 font-medium">성별</p>
              <div className="flex gap-4">
                {(['BOY', 'GIRL'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all ${
                      gender === g 
                        ? 'border-primary bg-yellow-50 text-yellow-800' 
                        : 'border-gray-100 bg-white text-gray-400'
                    }`}
                  >
                    {g === 'BOY' ? '왕자님' : '공주님'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-bold text-gray-800">
              {name} 아기는<br/>
              언제 <span className="text-secondary">태어났나요?</span>
            </h2>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-all text-lg appearance-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={step === 1 ? !name : !birthDate}
          className={`w-full mt-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md ${
            (step === 1 ? name : birthDate)
              ? 'bg-primary text-yellow-900 hover:bg-primaryDark hover:text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {step === 1 ? '다음으로' : '시작하기'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
