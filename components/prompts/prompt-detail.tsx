"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Heart } from "lucide-react";
import { toast } from "sonner";
import type { Session, User } from "@supabase/supabase-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupabaseSetupNotice } from "@/components/prompts/setup-notice";
import { getPromptCategoryLabel } from "@/lib/community-prompts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PromptRow } from "@/lib/supabase/types";

type PromptDetailRow = PromptRow & {
  profiles: { username: string } | null;
};

interface PromptDetailData {
  id: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  authorName: string;
  copyCount: number;
  likesCount: number;
  viewerLiked: boolean;
}

function isEmailVerified(user: User | null): boolean {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
}

export function PromptDetail({ promptId }: { promptId: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [prompt, setPrompt] = useState<PromptDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase));
  const [copied, setCopied] = useState(false);

  const user = session?.user ?? null;
  const verified = isEmailVerified(user);

  const loadPrompt = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("prompts")
      .select(
        "id, author_id, title, description, body, category, tags, status, view_count, copy_count, created_at, updated_at, profiles(username)"
      )
      .eq("id", promptId)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (!data) {
      setPrompt(null);
      setIsLoading(false);
      return;
    }

    const row = data as unknown as PromptDetailRow;
    const [{ data: likeRows }, { data: viewerLikeRows }] = await Promise.all([
      supabase.from("prompt_likes").select("prompt_id").eq("prompt_id", row.id),
      user
        ? supabase
            .from("prompt_likes")
            .select("prompt_id")
            .eq("prompt_id", row.id)
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);

    setPrompt({
      id: row.id,
      title: row.title,
      description: row.description,
      body: row.body,
      category: row.category,
      tags: row.tags ?? [],
      authorName: row.profiles?.username ?? "익명",
      copyCount: row.copy_count,
      likesCount: likeRows?.length ?? 0,
      viewerLiked: Boolean(viewerLikeRows?.length),
    });
    setIsLoading(false);
  }, [promptId, supabase, user]);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPrompt();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPrompt]);

  const handleCopy = async () => {
    if (!supabase || !prompt) return;

    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopied(true);
      toast.success("프롬프트를 복사했습니다.");
      setTimeout(() => setCopied(false), 1600);

      void supabase.rpc("increment_prompt_copy_count", {
        target_prompt_id: prompt.id,
      });

      setPrompt({ ...prompt, copyCount: prompt.copyCount + 1 });
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  const handleLike = async () => {
    if (!supabase || !prompt) return;

    if (!user) {
      toast.error("로그인 후 좋아요를 누를 수 있습니다.");
      return;
    }

    if (!verified) {
      toast.error("이메일 인증 후 좋아요를 누를 수 있습니다.");
      return;
    }

    const nextLiked = !prompt.viewerLiked;
    setPrompt({
      ...prompt,
      viewerLiked: nextLiked,
      likesCount: prompt.likesCount + (nextLiked ? 1 : -1),
    });

    const result = nextLiked
      ? await supabase
          .from("prompt_likes")
          .insert({ prompt_id: prompt.id, user_id: user.id })
      : await supabase
          .from("prompt_likes")
          .delete()
          .eq("prompt_id", prompt.id)
          .eq("user_id", user.id);

    if (result.error) {
      toast.error(result.error.message);
      void loadPrompt();
    }
  };

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          프롬프트를 불러오는 중입니다.
        </CardContent>
      </Card>
    );
  }

  if (!prompt) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <p className="font-medium">프롬프트를 찾을 수 없습니다.</p>
          <Button asChild variant="outline">
            <Link href="/prompts">목록으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="outline" size="sm">
        <Link href="/prompts">목록으로</Link>
      </Button>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {getPromptCategoryLabel(prompt.category)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              by {prompt.authorName}
            </span>
          </div>
          <CardTitle className="text-2xl">{prompt.title}</CardTitle>
          <p className="text-muted-foreground">{prompt.description}</p>
          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {prompt.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-4 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {prompt.body}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleLike}>
              <Heart
                className={
                  prompt.viewerLiked
                    ? "mr-2 h-4 w-4 fill-current"
                    : "mr-2 h-4 w-4"
                }
              />
              좋아요 {prompt.likesCount}
            </Button>
            <Button onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  프롬프트 복사
                </>
              )}
            </Button>
            <span className="self-center text-sm text-muted-foreground">
              총 복사 {prompt.copyCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
