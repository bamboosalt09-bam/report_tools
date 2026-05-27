export const promptCategoryOptions = [
  { value: "report", label: "보고서" },
  { value: "study", label: "학습" },
  { value: "writing", label: "글쓰기" },
  { value: "presentation", label: "발표" },
  { value: "coding", label: "코딩" },
  { value: "career", label: "진로" },
  { value: "other", label: "기타" },
] as const;

export type PromptCategoryValue = (typeof promptCategoryOptions)[number]["value"];

export function getPromptCategoryLabel(category: string | null): string {
  return (
    promptCategoryOptions.find((option) => option.value === category)?.label ??
    "기타"
  );
}

export function normalizeTags(rawTags: string): string[] {
  return rawTags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}
