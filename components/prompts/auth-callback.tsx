"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SupabaseSetupNotice } from "@/components/prompts/setup-notice";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [message, setMessage] = useState("이메일 인증을 확인하는 중입니다.");

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    const code = searchParams.get("code");

    async function completeAuth() {
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      }

      setMessage("인증이 완료되었습니다. 프롬프트 페이지로 이동합니다.");
      router.replace("/prompts");
    }

    void completeAuth();
  }, [router, searchParams, supabase]);

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
