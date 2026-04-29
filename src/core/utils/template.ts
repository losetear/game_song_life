/**
 * 简单模板插值
 * 用法: interpolate("你好{name}，今天是{day}天", { name: "张三", day: 3 })
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}
