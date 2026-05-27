export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Report Tools</p>
        <p>글자수 검사, 이미지, PDF 작업을 한 곳에서</p>
      </div>
    </footer>
  );
}
