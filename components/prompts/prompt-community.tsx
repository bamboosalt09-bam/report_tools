"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  Check,
  Copy,
  Heart,
  KeyRound,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupabaseSetupNotice } from "@/components/prompts/setup-notice";
import {
  getPromptCategoryLabel,
  promptCategoryOptions,
} from "@/lib/community-prompts";
import { getAnonymousLikeId } from "@/lib/anonymous-likes";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PromptRow } from "@/lib/supabase/types";

interface CommunityPrompt {
  id: string;
  authorId: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  status: PromptRow["status"];
  authorName: string;
  createdAt: string;
  copyCount: number;
  likesCount: number;
  viewerLiked: boolean;
}

type AuthMode = "signin" | "signup";
type SortMode = "latest" | "likes" | "copies";
type ViewMode = "all" | "mine" | "liked";

type PromptResult = PromptRow & {
  profiles: { username: string } | null;
};

const promptSelect =
  "id, author_id, title, description, body, category, tags, status, view_count, copy_count, created_at, updated_at, profiles!prompts_author_id_fkey(username)";

function isEmailVerified(user: User | null): boolean {
  return Boolean(user?.email_confirmed_at ?? user?.confirmed_at);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function PromptCommunity() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [prompts, setPrompts] = useState<CommunityPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase));
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<"user" | "admin" | null>(
    null
  );
  const [anonymousLikeId, setAnonymousLikeId] = useState<string | null>(null);

  const user = session?.user ?? null;
  const verified = isEmailVerified(user);
  const isAdmin = currentRole === "admin";

  const loadPrompts = useCallback(async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data: publishedData, error: publishedError } = await supabase
      .from("prompts")
      .select(promptSelect)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (publishedError) {
      toast.error(publishedError.message);
      setIsLoading(false);
      return;
    }

    const mergedRows = new Map<string, PromptResult>();
    for (const prompt of (publishedData ?? []) as unknown as PromptResult[]) {
      mergedRows.set(prompt.id, prompt);
    }

    if (user) {
      const { data: ownData, error: ownError } = await supabase
        .from("prompts")
        .select(promptSelect)
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (ownError) {
        toast.error(ownError.message);
        setIsLoading(false);
        return;
      }

      for (const prompt of (ownData ?? []) as unknown as PromptResult[]) {
        mergedRows.set(prompt.id, prompt);
      }
    }

    const rows = [...mergedRows.values()];
    const promptIds = rows.map((prompt) => prompt.id);
    const likesByPrompt = new Map<string, number>();
    const viewerLiked = new Set<string>();

    if (promptIds.length > 0) {
      const { data: likeRows } = await supabase
        .from("prompt_likes")
        .select("prompt_id")
        .in("prompt_id", promptIds);

      for (const like of likeRows ?? []) {
        likesByPrompt.set(
          like.prompt_id,
          (likesByPrompt.get(like.prompt_id) ?? 0) + 1
        );
      }

      if (user) {
        const { data: viewerLikeRows } = await supabase
          .from("prompt_likes")
          .select("prompt_id")
          .eq("user_id", user.id)
          .in("prompt_id", promptIds);

        for (const like of viewerLikeRows ?? []) {
          viewerLiked.add(like.prompt_id);
        }
      } else if (anonymousLikeId) {
        const { data: viewerLikeRows } = await supabase
          .from("prompt_likes")
          .select("prompt_id")
          .eq("anon_id", anonymousLikeId)
          .in("prompt_id", promptIds);

        for (const like of viewerLikeRows ?? []) {
          viewerLiked.add(like.prompt_id);
        }
      }
    }

    setPrompts(
      rows.map((prompt) => ({
        id: prompt.id,
        authorId: prompt.author_id,
        title: prompt.title,
        description: prompt.description,
        body: prompt.body,
        category: prompt.category,
        tags: prompt.tags ?? [],
        status: prompt.status,
        authorName: prompt.profiles?.username ?? "익명",
        createdAt: prompt.created_at,
        copyCount: prompt.copy_count,
        likesCount: likesByPrompt.get(prompt.id) ?? 0,
        viewerLiked: viewerLiked.has(prompt.id),
      }))
    );
    setIsLoading(false);
  }, [anonymousLikeId, supabase, user]);

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
      setAnonymousLikeId(getAnonymousLikeId());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    let ignore = false;

    async function loadCurrentRole() {
      if (!user) {
        setCurrentRole(null);
        return;
      }

      const { data } = await client
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!ignore) {
        setCurrentRole(data?.role ?? null);
      }
    }

    void loadCurrentRole();

    return () => {
      ignore = true;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (user || viewMode === "all") return;

    const timer = window.setTimeout(() => {
      setViewMode("all");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [user, viewMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPrompts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPrompts]);

  const visiblePrompts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...prompts]
      .filter((prompt) => {
        const matchesView =
          viewMode === "all" ||
          (viewMode === "mine" && user?.id === prompt.authorId) ||
          (viewMode === "liked" && Boolean(user) && prompt.viewerLiked);
        const matchesCategory =
          categoryFilter === "all" || prompt.category === categoryFilter;
        const matchesQuery =
          query.length === 0 ||
          [prompt.title, prompt.description, prompt.body, ...prompt.tags]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesView && matchesCategory && matchesQuery;
      })
      .sort((left, right) => {
        const latestDiff =
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime();

        if (sortMode === "likes") {
          return right.likesCount - left.likesCount || latestDiff;
        }

        if (sortMode === "copies") {
          return right.copyCount - left.copyCount || latestDiff;
        }

        return latestDiff;
      });
  }, [categoryFilter, prompts, searchQuery, sortMode, user, viewMode]);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    setIsAuthBusy(true);

    if (authMode === "signup") {
      const username = authUsername.trim() || authEmail.split("@")[0] || "사용자";
      const { error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username },
        },
      });

      setIsAuthBusy(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("인증 메일을 보냈습니다. 이메일 확인 후 로그인하세요.");
      setAuthPassword("");
      setAuthMode("signin");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });
    setIsAuthBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!isEmailVerified(data.user)) {
      await supabase.auth.signOut();
      toast.error("이메일 인증 후 로그인할 수 있습니다.");
      return;
    }

    toast.success("로그인되었습니다.");
    setAuthPassword("");
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    toast.success("로그아웃되었습니다.");
  };

  const handleCopy = async (prompt: CommunityPrompt) => {
    if (!supabase) return;

    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopiedPromptId(prompt.id);
      toast.success("프롬프트를 복사했습니다.");
      setTimeout(() => setCopiedPromptId(null), 1600);

      void supabase.rpc("increment_prompt_copy_count", {
        target_prompt_id: prompt.id,
      });

      setPrompts((current) =>
        current.map((item) =>
          item.id === prompt.id
            ? { ...item, copyCount: item.copyCount + 1 }
            : item
        )
      );
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  const handleLike = async (prompt: CommunityPrompt) => {
    if (!supabase) return;

    const nextLiked = !prompt.viewerLiked;
    const visitorId = anonymousLikeId ?? getAnonymousLikeId();
    if (!anonymousLikeId) setAnonymousLikeId(visitorId);

    setPrompts((current) =>
      current.map((item) =>
        item.id === prompt.id
          ? {
              ...item,
              viewerLiked: nextLiked,
              likesCount: item.likesCount + (nextLiked ? 1 : -1),
            }
          : item
      )
    );

    const result = user
      ? nextLiked
        ? await supabase
            .from("prompt_likes")
            .insert({ prompt_id: prompt.id, user_id: user.id })
        : await supabase
            .from("prompt_likes")
            .delete()
            .eq("prompt_id", prompt.id)
            .eq("user_id", user.id)
      : await supabase.rpc("toggle_anonymous_prompt_like", {
          target_prompt_id: prompt.id,
          visitor_id: visitorId,
          should_like: nextLiked,
        });

    if (result.error) {
      toast.error(result.error.message);
      void loadPrompts();
    }
  };

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {user && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "all" ? "secondary" : "outline"}
              onClick={() => setViewMode("all")}
            >
              전체 프롬프트
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "mine" ? "secondary" : "outline"}
              onClick={() => setViewMode("mine")}
            >
              내 프롬프트
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "liked" ? "secondary" : "outline"}
              onClick={() => setViewMode("liked")}
            >
              좋아요한 프롬프트
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="제목, 태그, 내용 검색"
              className="pl-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">전체 카테고리</option>
            {promptCategoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="프롬프트 정렬"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="latest">최신순</option>
            <option value="likes">좋아요 순</option>
            <option value="copies">복사된 순</option>
          </select>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              프롬프트를 불러오는 중입니다.
            </CardContent>
          </Card>
        ) : visiblePrompts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              아직 조건에 맞는 프롬프트가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visiblePrompts.map((prompt) => (
              <Card key={prompt.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">
                        {getPromptCategoryLabel(prompt.category)}
                      </Badge>
                      {prompt.status === "hidden" && (
                        <Badge variant="outline">숨김</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(prompt.createdAt)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-base">
                    <Link href={`/prompts/${prompt.id}`}>{prompt.title}</Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {prompt.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  {prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prompt.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>by {prompt.authorName}</span>
                    <span>복사 {prompt.copyCount}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLike(prompt)}
                    >
                      <Heart
                        className={
                          prompt.viewerLiked
                            ? "mr-1 h-4 w-4 fill-current"
                            : "mr-1 h-4 w-4"
                        }
                      />
                      {prompt.likesCount}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopy(prompt)}
                    >
                      {copiedPromptId === prompt.id ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          복사
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {user ? "내 계정" : "이메일 로그인"}
            </CardTitle>
            <CardDescription>
              이메일 인증이 완료된 사용자만 프롬프트를 등록할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {verified ? "이메일 인증 완료" : "이메일 인증 필요"}
                    </p>
                  </div>
                </div>
                {verified ? (
                  <Button asChild className="w-full">
                    <Link href="/prompts/new">
                      <Plus className="mr-2 h-4 w-4" />새 프롬프트 등록
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    <Plus className="mr-2 h-4 w-4" />새 프롬프트 등록
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/account">
                    <KeyRound className="mr-2 h-4 w-4" />
                    계정 설정
                  </Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/prompts">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      프롬프트 관리
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div className="grid grid-cols-2 rounded-md border p-1">
                  <Button
                    type="button"
                    variant={authMode === "signin" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setAuthMode("signin")}
                  >
                    로그인
                  </Button>
                  <Button
                    type="button"
                    variant={authMode === "signup" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setAuthMode("signup")}
                  >
                    가입
                  </Button>
                </div>
                {authMode === "signup" && (
                  <div className="space-y-1">
                    <Label htmlFor="username">닉네임</Label>
                    <Input
                      id="username"
                      value={authUsername}
                      onChange={(event) => setAuthUsername(event.target.value)}
                      minLength={2}
                      maxLength={24}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isAuthBusy}>
                  {isAuthBusy
                    ? "처리 중"
                    : authMode === "signup"
                      ? "인증 메일 받기"
                      : "로그인"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
