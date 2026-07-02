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
  {
    id: "admission-parser",
    name: "모집요강 학과 추출기",
    description: "대학 모집요강 PDF에서 전형별 학과리스트를 추출",
    features: [
      "PDF 업로드 → 표 데이터 추출",
      "전형별 학과·모집인원 구조화",
      "전형 선택 → 학과 리스트 표 확인",
      "JSON·Excel·Markdown 원하는 형태로 다운로드",
    ],
    href: process.env.NEXT_PUBLIC_ADMISSION_URL ?? "/admission/",
    tags: ["입시", "PDF", "추출", "Excel"],
    category: "데이터 분석",
    developer: "심준혁",
  },
];