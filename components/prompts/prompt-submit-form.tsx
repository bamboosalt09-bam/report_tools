"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupabaseSetupNotice } from "@/components/prompts/setup-notice";
import {
  normalizeTags,
  promptCategoryOptions,
} from "@/lib/community-prompts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function isEmailVerified(user: User | null): boolean {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
}

export function PromptSubmitForm() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("report");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = session?.user ?? null;
  const verified = isEmailVerified(user);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    if (!user) {
      toast.error("로그인 후 등록할 수 있습니다.");
      return;
    }

    if (!verified) {
      toast.error("이메일 인증 후 등록할 수 있습니다.");
      return;
    }

    if (title.trim().length < 4 || description.trim().length < 10) {
      toast.error("제목과 설명을 조금 더 구체적으로 입력하세요.");
      return;
    }

    if (body.trim().length < 30) {
      toast.error("프롬프트 본문은 30자 이상 입력하세요.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        author_id: user.id,
        title: title.trim(),
        description: description.trim(),
        body: body.trim(),
        category,
        tags: normalizeTags(tags),
      })
      .select("id")
      .single();

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("프롬프트를 등록했습니다.");
    router.push(`/prompts/${data.id}`);
  };

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="font-medium">로그인이 필요합니다.</p>
          <p className="text-sm text-muted-foreground">
            프롬프트 목록 페이지에서 이메일 인증 후 등록할 수 있습니다.
          </p>
          <Button onClick={() => router.push("/prompts")}>프롬프트로 이동</Button>
        </CardContent>
      </Card>
    );
  }

  if (!verified) {
    return (
      <Card>
        <CardContent className="space-y-3 py-8 text-center">
          <p className="font-medium">이메일 인증이 필요합니다.</p>
          <p className="text-sm text-muted-foreground">
            가입 시 받은 인증 메일을 확인한 뒤 다시 시도하세요.
          </p>
          <Button variant="outline" onClick={() => router.push("/prompts")}>
            돌아가기
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1">
              <Label htmlFor="prompt-title">제목</Label>
              <Input
                id="prompt-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 과학 실험 보고서 초안 프롬프트"
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-description">짧은 설명</Label>
              <Input
                id="prompt-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="어떤 상황에서 쓰는 프롬프트인지 적어주세요."
                maxLength={160}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-body">프롬프트 본문</Label>
              <textarea
                id="prompt-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="복사해서 바로 쓸 수 있는 형태로 작성하세요."
                className="min-h-[360px] w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1">
              <Label htmlFor="prompt-category">카테고리</Label>
              <select
                id="prompt-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {promptCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="prompt-tags">태그</Label>
              <Input
                id="prompt-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="보고서, 과학, 고등학교"
              />
              <p className="text-xs text-muted-foreground">
                쉼표로 구분, 최대 8개까지 저장합니다.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "등록 중" : "프롬프트 등록"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/prompts")}
            >
              취소
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
