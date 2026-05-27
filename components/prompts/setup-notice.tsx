import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SupabaseSetupNotice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Supabase 연결이 필요합니다</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          프롬프트 커뮤니티는 로그인과 데이터 저장이 필요해서 Supabase
          환경변수가 있어야 활성화됩니다.
        </p>
        <div className="rounded-md bg-muted p-3 font-mono text-xs text-foreground">
          <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
          <p>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...</p>
        </div>
        <p>
          Supabase에서 legacy anon key를 쓰는 경우에는
          <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code>로 넣어도 됩니다.
        </p>
        <p>
          DB 테이블과 보안 정책은 <code>supabase/schema.sql</code>을 Supabase
          SQL Editor에서 실행하면 됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
