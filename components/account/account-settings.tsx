"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { KeyRound, Mail, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

import { SupabaseSetupNotice } from "@/components/prompts/setup-notice";
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
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AccountProfile {
  id: string;
  username: string;
  role: "user" | "admin";
}

export function AccountSettings() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProfileBusy, setIsProfileBusy] = useState(false);
  const [isEmailBusy, setIsEmailBusy] = useState(false);
  const [isPasswordBusy, setIsPasswordBusy] = useState(false);

  const user = session?.user ?? null;

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
        setUsername("");
        setEmail("");
        return;
      }

      setEmail(user.email ?? "");
      const { data, error } = await client
        .from("profiles")
        .select("id, username, role")
        .eq("id", user.id)
        .maybeSingle();

      if (ignore) return;

      if (error) {
        toast.error(error.message);
        return;
      }

      const nextProfile = (data as AccountProfile | null) ?? null;
      setProfile(nextProfile);
      setUsername(nextProfile?.username ?? "");
    }

    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [isAuthReady, supabase, user]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 24) {
      toast.error("닉네임은 2~24자로 입력하세요.");
      return;
    }

    setIsProfileBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: trimmedUsername })
      .eq("id", user.id);
    setIsProfileBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setProfile((current) =>
      current ? { ...current, username: trimmedUsername } : current
    );
    toast.success("닉네임을 변경했습니다.");
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user) return;

    const nextEmail = email.trim();
    if (!nextEmail || nextEmail === user.email) {
      toast.error("새 이메일을 입력하세요.");
      return;
    }

    setIsEmailBusy(true);
    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    setIsEmailBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("이메일 변경 확인 메일을 보냈습니다.");
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    if (newPassword.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsPasswordBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    toast.success("비밀번호를 변경했습니다.");
  };

  if (!supabase) {
    return <SupabaseSetupNotice />;
  }

  if (!isAuthReady) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          계정 정보를 확인하는 중입니다.
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
            프롬프트 커뮤니티에서 이메일 계정으로 로그인한 뒤 계정을 변경할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/prompts">로그인하러 가기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4" />
            닉네임
          </CardTitle>
          <CardDescription>
            프롬프트 작성자 이름으로 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="account-username">닉네임</Label>
              <Input
                id="account-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={2}
                maxLength={24}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              현재 권한: {profile?.role === "admin" ? "관리자" : "사용자"}
            </p>
            <Button type="submit" className="w-full" disabled={isProfileBusy}>
              <Save className="mr-2 h-4 w-4" />
              저장
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            이메일 아이디
          </CardTitle>
          <CardDescription>
            로그인에 사용하는 이메일 주소입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="account-email">새 이메일</Label>
              <Input
                id="account-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isEmailBusy}>
              <Mail className="mr-2 h-4 w-4" />
              변경 메일 발송
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            비밀번호
          </CardTitle>
          <CardDescription>
            로그인 중인 계정의 비밀번호를 변경합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="account-password">새 비밀번호</Label>
              <Input
                id="account-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="account-password-confirm">새 비밀번호 확인</Label>
              <Input
                id="account-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPasswordBusy}>
              <KeyRound className="mr-2 h-4 w-4" />
              비밀번호 변경
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
