import { Suspense } from "react";
import { AuthCallback } from "@/components/prompts/auth-callback";

export const metadata = {
  title: "이메일 인증",
};

export default function AuthCallbackPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense fallback={null}>
        <AuthCallback />
      </Suspense>
    </div>
  );
}
