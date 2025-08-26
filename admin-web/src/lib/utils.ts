// 간단한 className 유틸 (외부 라이브러리 없이 동작)
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
