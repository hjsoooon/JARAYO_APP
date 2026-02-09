// 랜덤 동화 생성 서비스 (API 키 없이 작동)

const storyTemplates = [
  {
    template: (name: string) => `오늘 ${name}는 작은 모험가가 되었어요. 부드러운 담요 숲을 지나, 베개 산을 넘어, 마침내 엄마 품이라는 따뜻한 왕국에 도착했답니다. "${name}야, 오늘도 수고했어!" 별들이 속삭였어요.`,
  },
  {
    template: (name: string) => `${name}의 작은 손가락이 꿈틀꿈틀 움직였어요. "안녕, 세상아!" 하고 인사하는 것 같았죠. 햇살이 창문으로 살며시 들어와 ${name}의 볼에 뽀뽀했어요. 오늘도 행복한 하루가 시작됐답니다.`,
  },
  {
    template: (name: string) => `구름 나라에서 온 작은 천사 ${name}! 오늘은 우유 강을 건너고, 딸랑이 종소리를 따라 춤을 췄어요. 밤이 되자 달님이 자장가를 불러주었고, ${name}는 새근새근 잠이 들었답니다.`,
  },
  {
    template: (name: string) => `${name}는 오늘 아주 용감했어요. 무서운 목욕 괴물(사실은 따뜻한 물이에요!)을 만났지만 씩씩하게 이겨냈거든요. 보송보송해진 ${name}에게 엄마가 말했어요. "우리 영웅님, 사랑해!"`,
  },
  {
    template: (name: string) => `작은 왕자 ${name}의 하루는 특별했어요. 맛있는 우유를 마시고, 포근한 이불 속에서 달콤한 꿈을 꾸었죠. 꿈속에서 ${name}는 무지개를 타고 하늘을 날았답니다. 내일은 또 어떤 모험이 기다리고 있을까요?`,
  },
  {
    template: (name: string) => `"짹짹!" 창밖의 새가 ${name}를 깨웠어요. ${name}는 기지개를 켜며 방긋 웃었답니다. 오늘 하루도 사랑으로 가득 찰 거예요. 엄마 아빠의 따뜻한 품에서 ${name}는 세상에서 가장 행복한 아기랍니다.`,
  },
  {
    template: (name: string) => `${name}는 오늘 마법의 딸랑이를 발견했어요! 흔들 때마다 반짝반짝 별빛이 났죠. 엄마가 말했어요. "그건 ${name}의 웃음소리만큼 예쁜 소리야." ${name}는 더 크게 웃었답니다.`,
  },
  {
    template: (name: string) => `솜사탕 구름 위에서 ${name}가 낮잠을 잤어요. 달콤한 꿈속에서 토끼 친구를 만나 같이 놀았죠. "다음에 또 놀자!" 토끼가 손을 흔들었어요. ${name}는 행복한 미소를 지으며 눈을 떴답니다.`,
  },
];

const activityStories: Record<string, (name: string) => string> = {
  FEED: (name) => `오늘 ${name}는 맛있는 우유를 먹었어요. 쪽쪽쪽! 마법의 음료를 마신 ${name}는 힘이 불끈! 세상에서 가장 튼튼한 아기가 될 거예요.`,
  SLEEP: (name) => `새근새근... ${name}가 꿈나라로 여행을 떠났어요. 구름 침대에서 달님과 별님이 자장가를 불러주었답니다. 좋은 꿈 꿔, 우리 ${name}!`,
  DIAPER: (name) => `${name}는 오늘도 깨끗하고 보송보송해졌어요! 상쾌한 기분으로 방긋 웃는 ${name}. 엄마가 "우리 ${name} 기분 좋지?" 하고 물었어요.`,
  BATH: (name) => `첨벙첨벙! 물놀이를 좋아하는 ${name}가 오늘도 목욕 시간을 즐겼어요. 거품 왕국의 왕자가 된 것처럼 신나게 놀았답니다!`,
};

export const generateDiaryEntry = async (
  childName: string, 
  userResponse: string, 
  phrSummary: string
): Promise<string> => {
  // 약간의 딜레이를 추가하여 생성 중인 느낌을 줍니다
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

  // PHR 기록에서 활동 타입 추출
  const activityTypes = ['FEED', 'SLEEP', 'DIAPER', 'BATH'];
  const foundActivity = activityTypes.find(type => phrSummary.includes(type));

  // 활동 기반 스토리가 있으면 50% 확률로 사용
  if (foundActivity && Math.random() > 0.5) {
    return activityStories[foundActivity](childName);
  }

  // 랜덤 템플릿 선택
  const randomIndex = Math.floor(Math.random() * storyTemplates.length);
  return storyTemplates[randomIndex].template(childName);
};
