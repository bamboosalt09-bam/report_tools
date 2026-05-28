import { redirect } from "next/navigation";

export const metadata = {
  title: "한영 오타 변환기",
  description:
    "키보드 입력 언어를 잘못 둔 채 입력한 문장을 한글 또는 영문 키 입력으로 변환합니다.",
};

export default function KeyboardConverterPage() {
  redirect("/writing-tools");
}
