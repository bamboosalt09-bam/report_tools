"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { SupabaseSetupNotice } from "@/components/prompts/setup-notice";
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
import { getPromptCategoryLabel } from "@/lib/community-prompts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PromptRow } from "@/lib/supabase/types";

type PromptStatus = PromptRow["status"];
type StatusFilter = "all" | PromptStatus;

interface AdminProfile {
  id: string;
  username: string;
  role: "user" | "admin";
}

type AdminPromptResult = PromptRow & {
  profiles: { username: string } | null;
};

interface AdminPrompt {
  id: string;
  title: string;
  description: string;
  body: string;
  category: string;
  tags: string[];
  status: PromptStatus;
  authorName: string;
  copyCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: PromptStatus): string {
  return status === "published" ? "공개" : "숨김";
}

export function AdminPromptManager() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(() =>
    Boolean(supabase)
  );
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const user = session?.user ?? null;
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !isAuthReady) return;

    const client = supabase;
    let ignore = false;

    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setIsCheckingAccess(false);
        return;
      }

      setIsCheckingAccess(true);
      const { data, error } = await client
        .from("profiles")
        .select("id, username, role")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (error) {
        toast.error(error.message);
        setProfile(null);
        setIsCheckingAccess(false);
        return;
      }

      setProfile((data as AdminProfile | null) ?? null);
      setIsCheckingAccess(false);
    }

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, [isAuthReady, supabase, user]);

  const loadPrompts = useCallback(async () => {
    if (!supabase || !isAdmin) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("prompts")
      .select(
        "id, author_id, title, description, body, category, tags, status, view_count, copy_count, created_at, updated_at, profiles!prompts_author_id_fkey(username)"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as unknown as AdminPromptResult[];
    setPrompts(
      rows.map((prompt) => ({
        id: prompt.id,
        title: prompt.title,
        description: prompt.description,
        body: prompt.body,
        category: prompt.category,
        tags: prompt.tags ?? [],
        status: prompt.status,
        authorName: prompt.profiles?.username ?? "익명",
        copyCount: prompt.copy_count,
        viewCount: prompt.view_count,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at,
      }))
    );
    setIsLoading(false);
  }, [isAdmin, supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(() => {
      void loadPrompts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAdmin, loadPrompts]);

  const stats = useMemo(() => {
    return {
      total: prompts.length,
      published: prompts.filter((prompt) => prompt.status === "published")
        .length,
      hidden: prompts.filter((prompt) => prompt.status === "hidden").length,
    };
  }, [prompts]);

  const visiblePrompts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return prompts.filter((prompt) => {
      const matchesStatus =
        statusFilter === "all" || prompt.status === statusFilter;
      const matchesQuery =
        query.length === 0 ||
        [
          prompt.title,
          prompt.description,
          prompt.body,
          prompt.category,
          prompt.authorName,
          ...prompt.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [prompts, searchQuery, statusFilter]);

  const handleStatusChange = async (
    promptId: string,
    nextStatus: PromptStatus
  ) => {
    if (!supabase || !isAdmin) return;

    setBusyAction(`${promptId}:${nextStatus}`);
    const { error } = await supabase
      .from("prompts")
      .update({ status: nextStatus })
      .eq("id", promptId);

    if (error) {
      toast.error(error.message);
      setBusyAction(null);
      return;
    }

    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === promptId ? { ...prompt, status: nextStatus } : prompt
      )
    );
    toast.success(`프롬프트를 ${getStatusLabel(nextStatus)} 상태로 변경했습니다.`);
    setBusyAction(null);
  };

  const handleDelete = async (prompt: AdminPrompt) => {
    if (!supabase || !isAdmin) return;

    const confirmed = window.confirm(
      `"${prompt.title}" 프롬프트를 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    setBusyAction(`${prompt.id}:delete`);
    const { error } = await supabase
      .from("prompts")
      .delete()
      .eq("id", prompt.id);

    if (error) {
      toast.error(error.message);
      setBusyAction(null);
      return;
    }

    setPrompts((current) => current.filter((item) => item.id !== prompt.id));
    toast.success("프롬프트를 삭제했습니다.");
    setBusyAction(null);
  };

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  if (!isAuthReady || isCheckingAccess) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          관리자 권한을 확인하는 중입니다.
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">로그인이 필요합니다</CardTitle>
          <CardDescription>
            프롬프트 커뮤니티에서 관리자 계정으로 로그인한 뒤 다시 열어주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/prompts">프롬프트 커뮤니티로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            관리자 전용 기능
          </CardTitle>
          <CardDescription>
            현재 계정에는 프롬프트 관리 권한이 없습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">전체</p>
            <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">공개</p>
            <p className="mt-1 text-2xl font-semibold">{stats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">숨김</p>
            <p className="mt-1 text-2xl font-semibold">{stats.hidden}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="제목, 작성자, 태그, 본문 검색"
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">전체 상태</option>
            <option value="published">공개</option>
            <option value="hidden">숨김</option>
          </select>
          <Button variant="outline" onClick={loadPrompts} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            프롬프트 목록을 불러오는 중입니다.
          </CardContent>
        </Card>
      ) : visiblePrompts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            조건에 맞는 프롬프트가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visiblePrompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      prompt.status === "published" ? "secondary" : "outline"
                    }
                  >
                    {getStatusLabel(prompt.status)}
                  </Badge>
                  <Badge variant="outline">
                    {getPromptCategoryLabel(prompt.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    작성자 {prompt.authorName} · {formatDate(prompt.createdAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="line-clamp-2 text-lg">
                      {prompt.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {prompt.description}
                    </CardDescription>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {prompt.status === "published" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(prompt.id, "hidden")}
                        disabled={busyAction !== null}
                      >
                        <EyeOff className="mr-1 h-4 w-4" />
                        숨김
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(prompt.id, "published")
                        }
                        disabled={busyAction !== null}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        공개
                      </Button>
                    )}
                    {prompt.status === "published" && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/prompts/${prompt.id}`}>
                          <ExternalLink className="mr-1 h-4 w-4" />
                          보기
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(prompt)}
                      disabled={busyAction !== null}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>복사 {prompt.copyCount}</span>
                  <span>조회 {prompt.viewCount}</span>
                  <span>수정 {formatDate(prompt.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
