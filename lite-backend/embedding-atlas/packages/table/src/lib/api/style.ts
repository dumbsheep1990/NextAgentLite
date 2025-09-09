// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

export interface ThemeConfig {
  primaryTextColor?: string;
  secondaryTextColor?: string;
  tertiaryTextColor?: string;
  fontFamily?: string;
  fontSize?: string;
  primaryBackgroundColor?: string;
  secondaryBackgroundColor?: string;
  tertiaryBackgroundColor?: string;
  hoverBackgroundColor?: string;
  headerFontFamily?: string;
  headerFontSize?: string;
  cellFontFamily?: string;
  cellFontSize?: string;
  scrollbarBackgroundColor?: string;
  scrollbarPillColor?: string;
  scrollbarLabelBackgroundColor?: string;
  shadow?: string;
  outlineColor?: string;
  dimmedRowColor?: string;
  rowScrollToColor?: string;
  rowHoverColor?: string;
}

export type Theme = ThemeConfig & {
  dark?: ThemeConfig;
  light?: ThemeConfig;
};

export function resolveTheme(theme: Theme, colorScheme: "light" | "dark"): ThemeConfig {
  return { ...theme, ...(theme[colorScheme] != null ? theme[colorScheme] : {}) };
}
