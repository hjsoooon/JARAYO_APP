
import { Message, ActionTip, CoachRole } from "../types";
import { KEYWORD_RESPONSES, SPECIFIC_RESPONSES } from "../constants";

// 키워드 기반 응답 시스템 (AI API 호출 없음)
export const getGeminiResponse = async (
  history: Message[], 
  userPrompt: string, 
  forcedCoachId?: CoachRole
): Promise<{ text: string, tips?: ActionTip[], selectedCoachId: CoachRole }> => {
  
  // 특정 질문에 대한 맞춤 응답 체크 (relatedQuestion용)
  const specificResponse = SPECIFIC_RESPONSES[userPrompt];
  if (specificResponse) {
    // 약간의 지연을 추가하여 자연스러운 느낌 제공
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    return {
      text: specificResponse.text,
      tips: specificResponse.tips,
      selectedCoachId: specificResponse.coachId as CoachRole
    };
  }
  
  // 입력 텍스트를 소문자로 변환하여 키워드 매칭
  const input = userPrompt.toLowerCase();
  
  // forcedCoachId가 있으면 해당 카테고리에서 응답 선택
  if (forcedCoachId) {
    const categoryMap: Record<string, keyof typeof KEYWORD_RESPONSES> = {
      'SLEEP_EXPERT': 'SLEEP',
      'NUTRITION': 'NUTRITION',
      'PSYCHOLOGY': 'PSYCHOLOGY',
      'DEVELOPMENT_COACH': 'DEVELOPMENT',
      'POOP_GUIDE': 'POOP'
    };
    
    const category = categoryMap[forcedCoachId] || 'GENERAL';
    const categoryData = KEYWORD_RESPONSES[category] as any;
    
    // 인사말 키워드 체크
    const greetingKeywords = categoryData.greetingKeywords || [];
    const isGreeting = greetingKeywords.some((keyword: string) => input.includes(keyword));
    
    // 인사말이고 해당 코치에 인사 응답이 있으면 인사 응답 반환
    if (isGreeting && categoryData.greetingResponse) {
      return {
        text: categoryData.greetingResponse.text,
        tips: categoryData.greetingResponse.tips,
        selectedCoachId: categoryData.coachId
      };
    }
    
    // 일반 응답
    const randomResponse = categoryData.responses[Math.floor(Math.random() * categoryData.responses.length)];
    
    return {
      text: randomResponse.text,
      tips: randomResponse.tips,
      selectedCoachId: categoryData.coachId
    };
  }
  
  // 각 카테고리별로 키워드 매칭 점수 계산
  let bestMatch: {
    category: keyof typeof KEYWORD_RESPONSES;
    score: number;
  } = { category: 'GENERAL', score: 0 };
  
  // 전문 분야 카테고리 (우선순위 높음)
  const expertCategories: (keyof typeof KEYWORD_RESPONSES)[] = ['SLEEP', 'NUTRITION', 'PSYCHOLOGY', 'DEVELOPMENT', 'POOP'];
  
  // 일반 대화 카테고리
  const generalCategories: (keyof typeof KEYWORD_RESPONSES)[] = ['GREETING', 'THANKS', 'CONCERN', 'BABY_INFO'];
  
  // 전문 분야 먼저 검색
  for (const category of expertCategories) {
    const categoryData = KEYWORD_RESPONSES[category];
    let score = 0;
    
    for (const keyword of categoryData.keywords) {
      if (input.includes(keyword)) {
        score += 2; // 전문 분야는 가중치 높게
        if (keyword.length > 2) score += 1;
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { category, score };
    }
  }
  
  // 전문 분야 매칭이 없으면 일반 대화 카테고리 검색
  if (bestMatch.score === 0) {
    for (const category of generalCategories) {
      const categoryData = KEYWORD_RESPONSES[category];
      let score = 0;
      
      for (const keyword of categoryData.keywords) {
        if (input.includes(keyword)) {
          score += 1;
          if (keyword.length > 2) score += 0.5;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { category, score };
      }
    }
  }
  
  // 매칭된 카테고리에서 랜덤 응답 선택
  const selectedCategory = bestMatch.score > 0 ? bestMatch.category : 'GENERAL';
  const categoryData = KEYWORD_RESPONSES[selectedCategory];
  const randomResponse = categoryData.responses[Math.floor(Math.random() * categoryData.responses.length)];
  
  // 약간의 지연을 추가하여 자연스러운 느낌 제공 (200-500ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  return {
    text: randomResponse.text,
    tips: randomResponse.tips,
    selectedCoachId: categoryData.coachId
  };
};
