/**
 * Curated, grouped workbench color IDs.
 *
 * This is a hand-picked subset covering the most visible ~80 UI colors,
 * organized by area. The webview also offers an "Add any color ID" input so
 * power users can reach any of the 700+ official IDs not listed here.
 *
 * Reference: https://code.visualstudio.com/api/references/theme-color
 */

export interface ColorDef {
  id: string;
  label: string;
}

export interface ColorGroup {
  group: string;
  /** Shown by default (curated). Items in `more` sit behind a "show all" toggle. */
  colors: ColorDef[];
}

export const COLOR_GROUPS: ColorGroup[] = [
  {
    group: "Editor",
    colors: [
      { id: "editor.background", label: "Editor background" },
      { id: "editor.foreground", label: "Editor text" },
      { id: "editorLineNumber.foreground", label: "Line numbers" },
      { id: "editorLineNumber.activeForeground", label: "Active line number" },
      { id: "editor.selectionBackground", label: "Selection" },
      { id: "editor.lineHighlightBackground", label: "Current line highlight" },
      { id: "editorCursor.foreground", label: "Cursor" },
      { id: "editor.findMatchBackground", label: "Find match" },
      { id: "editor.findMatchHighlightBackground", label: "Find match (others)" },
      { id: "editorWhitespace.foreground", label: "Whitespace marks" },
      { id: "editorIndentGuide.background1", label: "Indent guide" },
      { id: "editorIndentGuide.activeBackground1", label: "Active indent guide" },
      { id: "editorGutter.background", label: "Gutter background" },
    ],
  },
  {
    group: "Editor Widgets",
    colors: [
      { id: "editorWidget.background", label: "Widget background" },
      { id: "editorWidget.foreground", label: "Widget text" },
      { id: "editorWidget.border", label: "Widget border" },
      { id: "editorSuggestWidget.background", label: "Suggest widget bg" },
      { id: "editorSuggestWidget.selectedBackground", label: "Suggest selected" },
      { id: "editorHoverWidget.background", label: "Hover widget bg" },
    ],
  },
  {
    group: "Activity Bar",
    colors: [
      { id: "activityBar.background", label: "Background" },
      { id: "activityBar.foreground", label: "Active icon" },
      { id: "activityBar.inactiveForeground", label: "Inactive icon" },
      { id: "activityBar.border", label: "Border" },
      { id: "activityBarBadge.background", label: "Badge background" },
      { id: "activityBarBadge.foreground", label: "Badge text" },
    ],
  },
  {
    group: "Side Bar",
    colors: [
      { id: "sideBar.background", label: "Background" },
      { id: "sideBar.foreground", label: "Text" },
      { id: "sideBar.border", label: "Border" },
      { id: "sideBarTitle.foreground", label: "Title text" },
      { id: "sideBarSectionHeader.background", label: "Section header bg" },
      { id: "sideBarSectionHeader.foreground", label: "Section header text" },
    ],
  },
  {
    group: "Status Bar",
    colors: [
      { id: "statusBar.background", label: "Background" },
      { id: "statusBar.foreground", label: "Text" },
      { id: "statusBar.border", label: "Border" },
      { id: "statusBar.noFolderBackground", label: "No-folder background" },
      { id: "statusBar.debuggingBackground", label: "Debugging background" },
      { id: "statusBarItem.remoteBackground", label: "Remote item bg" },
      { id: "statusBarItem.remoteForeground", label: "Remote item text" },
    ],
  },
  {
    group: "Title Bar",
    colors: [
      { id: "titleBar.activeBackground", label: "Active background" },
      { id: "titleBar.activeForeground", label: "Active text" },
      { id: "titleBar.inactiveBackground", label: "Inactive background" },
      { id: "titleBar.inactiveForeground", label: "Inactive text" },
      { id: "titleBar.border", label: "Border" },
    ],
  },
  {
    group: "Tabs",
    colors: [
      { id: "editorGroupHeader.tabsBackground", label: "Tab bar background" },
      { id: "tab.activeBackground", label: "Active tab bg" },
      { id: "tab.activeForeground", label: "Active tab text" },
      { id: "tab.inactiveBackground", label: "Inactive tab bg" },
      { id: "tab.inactiveForeground", label: "Inactive tab text" },
      { id: "tab.border", label: "Tab border" },
      { id: "tab.activeBorderTop", label: "Active tab top border" },
      { id: "tab.activeBorder", label: "Active tab bottom border" },
    ],
  },
  {
    group: "Panel & Terminal",
    colors: [
      { id: "panel.background", label: "Panel background" },
      { id: "panel.border", label: "Panel border" },
      { id: "panelTitle.activeForeground", label: "Active panel title" },
      { id: "terminal.background", label: "Terminal background" },
      { id: "terminal.foreground", label: "Terminal text" },
      { id: "terminalCursor.foreground", label: "Terminal cursor" },
    ],
  },
  {
    group: "Buttons",
    colors: [
      { id: "button.background", label: "Button background" },
      { id: "button.foreground", label: "Button text" },
      { id: "button.hoverBackground", label: "Button hover" },
      { id: "button.secondaryBackground", label: "Secondary bg" },
      { id: "button.secondaryForeground", label: "Secondary text" },
    ],
  },
  {
    group: "Inputs",
    colors: [
      { id: "input.background", label: "Input background" },
      { id: "input.foreground", label: "Input text" },
      { id: "input.border", label: "Input border" },
      { id: "input.placeholderForeground", label: "Placeholder text" },
      { id: "focusBorder", label: "Focus border" },
      { id: "dropdown.background", label: "Dropdown background" },
      { id: "dropdown.foreground", label: "Dropdown text" },
    ],
  },
  {
    group: "Lists & Trees",
    colors: [
      { id: "list.activeSelectionBackground", label: "Active selection bg" },
      { id: "list.activeSelectionForeground", label: "Active selection text" },
      { id: "list.inactiveSelectionBackground", label: "Inactive selection bg" },
      { id: "list.hoverBackground", label: "Hover background" },
      { id: "list.focusBackground", label: "Focus background" },
      { id: "list.highlightForeground", label: "Match highlight" },
    ],
  },
  {
    group: "Badges & Misc",
    colors: [
      { id: "badge.background", label: "Badge background" },
      { id: "badge.foreground", label: "Badge text" },
      { id: "scrollbarSlider.background", label: "Scrollbar slider" },
      { id: "scrollbarSlider.hoverBackground", label: "Scrollbar hover" },
      { id: "progressBar.background", label: "Progress bar" },
      { id: "errorForeground", label: "Error text" },
      { id: "descriptionForeground", label: "Description text" },
    ],
  },
];

/** Flat lookup of every curated id -> label. */
export const COLOR_LABELS: Record<string, string> = Object.fromEntries(
  COLOR_GROUPS.flatMap((g) => g.colors.map((c) => [c.id, c.label]))
);
