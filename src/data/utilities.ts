export interface Utility {
  id: string;
  name: string;
  description: string;
  features: string[];
  href: string;
  tags: string[];
  category: string;
  developer: string;
}

export const utilities: Utility[] = [
  {
    id: "excel-ai-chat",
    name: "AiBle CHAT",
    description: "엑셀·CSV를 업로드하고 AI와 데이터 분석 대화",
    features: [
      "엑셀·CSV 업로드 및 시트 미리보기",
      "RAG 기반 질의응답 (커뮤니티·Q&A 데이터)",
      "Q&A 핫스팟·교재 구간 분석",
      "답변 PDF 다운로드·텍스트 복사",
    ],
    href: process.env.NEXT_PUBLIC_EXCEL_AI_CHAT_URL ?? "/chat/",
    tags: ["Excel", "AI", "Q&A", "커뮤니티"],
    category: "데이터 분석",
    developer: "심준혁",
  },
];
