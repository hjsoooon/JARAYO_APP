import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface AppHeaderProps {
  /** 센터 로고형: 가운데 로고 + 양쪽 아이콘 */
  variant?: 'center' | 'left';
  /** 타이틀 텍스트 */
  title: string;
  /** 타이틀 옆 서브텍스트 (센터형에서 작은 배지) */
  subtitle?: string;
  /** 좌측 아이콘/버튼 영역 (variant='center'일 때) */
  leftAction?: React.ReactNode;
  /** 우측 아이콘/버튼 영역 */
  rightAction?: React.ReactNode;
  /** 뒤로가기 (variant='left'일 때 자동 표시) */
  onBack?: () => void;
  /** 헤더 아래 추가 콘텐츠 (세그먼트 컨트롤 등) */
  children?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  variant = 'center',
  title,
  subtitle,
  leftAction,
  rightAction,
  onBack,
  children,
}) => {
  return (
    <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 border-b border-[#FFE5B4]/60 shadow-[0_1px_8px_rgba(255,179,71,0.08)]">
      {/* 메인 바 */}
      <div className="flex items-center justify-between px-5 h-[56px]">
        {/* 좌측 영역 */}
        <div className="flex items-center gap-2 min-w-[44px]">
          {variant === 'left' && onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-[#FFF4E0] flex items-center justify-center text-[#E8A838] active:scale-90 transition-all hover:bg-[#FFE9C6]"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
          )}
          {variant === 'center' && leftAction && (
            <div className="flex items-center">{leftAction}</div>
          )}
        </div>

        {/* 타이틀 영역 */}
        <div className={`flex items-center gap-2 ${variant === 'center' ? 'absolute left-1/2 -translate-x-1/2' : 'flex-1 ml-2'}`}>
          {variant === 'center' && (
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="logo" className="w-6 h-6" />
          )}
          <h1
            className={`font-extrabold tracking-tight ${
              variant === 'center'
                ? 'text-[18px] text-[#FFB347]'
                : 'text-[17px] text-gray-800'
            }`}
            style={{ fontFamily: "'Nunito', 'Noto Sans KR', sans-serif" }}
          >
            {title}
          </h1>
          {subtitle && (
            <span className="text-[10px] font-bold text-[#FFB347] bg-[#FFF4E0] px-2 py-0.5 rounded-full">
              {subtitle}
            </span>
          )}
        </div>

        {/* 우측 영역 */}
        <div className="flex items-center gap-2 min-w-[44px] justify-end">
          {rightAction}
        </div>
      </div>

      {/* 추가 콘텐츠 (세그먼트 컨트롤 등) */}
      {children && (
        <div className="px-5 pb-3">
          {children}
        </div>
      )}
    </header>
  );
};

/** 공통 헤더 아이콘 버튼 */
export const HeaderIconButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  badge?: number | string;
}> = ({ onClick, children, badge }) => (
  <button
    onClick={onClick}
    className="relative w-10 h-10 rounded-2xl bg-[#FFF4E0] flex items-center justify-center text-[#E8A838] active:scale-90 transition-all hover:bg-[#FFE9C6]"
  >
    {children}
    {badge !== undefined && badge !== 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#FF7A5C] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
        {typeof badge === 'number' && badge > 9 ? '9+' : badge}
      </span>
    )}
  </button>
);
