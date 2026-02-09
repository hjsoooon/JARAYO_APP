
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the environment variable API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDiaryEntry = async (
  childName: string, 
  userResponse: string, 
  phrSummary: string
): Promise<string> => {
  try {
    // Generate fairy tale content using gemini-3-flash-preview with proper system instruction.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `부모가 아이(${childName})의 육아 기록을 바탕으로 답장을 보냈습니다.
        사용자 입력: "${userResponse}"
        육아 기록 요약: ${phrSummary}
        위 내용을 바탕으로 아이가 주인공인 짧고 따뜻한 1인칭 시점의 동화 일기를 작성해주세요. 300자 이내.`,
      config: {
        systemInstruction: "당신은 따뜻한 동화 작가입니다.",
      }
    });

    // Access the .text property directly to get the generated string content.
    return response.text || "동화를 생성하지 못했어요.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "동화 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
  }
};
