// src/lib/seaPlaceholders.types.ts
// Simple types for placeholders — no imports needed

export interface PlaceholderItem {
  key: string;
  label: string;
  modelField: string;
  example?: string;
  group?: string;
}

export interface PlaceholderGroup {
  group: string;
  icon: string;
  items: PlaceholderItem[];
}

export interface TemplateSection {
  id: string;
  type: "richtext" | "placeholder_block" | "wage_table" | "disability_table" | "signature_block" | "spacer" | "divider";
  content?: string;
  order: number;
  label?: string;
}
