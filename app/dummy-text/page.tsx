import { redirect } from "next/navigation";

export const metadata = {
  title: "한글 더미 텍스트",
  description:
    "보고서, 공문, 기획서 양식 점검에 쓰기 좋은 한글 더미 문장과 어구를 생성합니다.",
};

export default function DummyTextPage() {
  redirect("/writing-tools");
}
