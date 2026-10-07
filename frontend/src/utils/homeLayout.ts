import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import type { LayoutConstraint } from 'react-grid-layout/core';

// Home-screen tiles. Order here = stacking order on phones.
export const TILE_IDS = ['actions', 'building', 'apartments', 'members', 'messages', 'docs'] as const;
export type TileId = (typeof TILE_IDS)[number];

// AWS-console-style grid: few wide columns of rectangle cells.
export const BREAKPOINTS = { lg: 1100, md: 700, sm: 0 } as const;
export const COLS = { lg: 4, md: 2, sm: 1 } as const;
export const MARGIN: [number, number] = [24, 24];
/** Row height as a share of the column width — cells are rectangles, wider than tall. */
const CELL_RATIO = 0.55;
const MAX_ROWS_PER_TILE = 3;

/** Row height for a grid of the given width, so cells keep their rectangle shape at any size. */
export function rowHeightFor(width: number) {
  const cols = width >= BREAKPOINTS.lg ? COLS.lg : width >= BREAKPOINTS.md ? COLS.md : COLS.sm;
  const colWidth = (width - MARGIN[0] * (cols - 1)) / cols;
  return Math.round(Math.min(Math.max(colWidth * CELL_RATIO, 140), 260));
}

/**
 * Keeps tiles from becoming strips: the long side may be at most twice the short side
 * (in cells). To make a tile wider than that, make it taller first — and vice versa.
 * The full-width quick-actions bar is the one exception.
 */
export const noStrips: LayoutConstraint = {
  name: 'noStrips',
  constrainSize(item, w, h) {
    if (item.i === 'actions') return { w, h };
    return { w: Math.min(w, h * 2), h: Math.min(h, w * 2) };
  },
};

const tile = (i: TileId, x: number, y: number, w: number, h: number, cols: number): LayoutItem =>
  i === 'actions'
    ? // Full-width bar, one row, move-only.
      { i, x: 0, y, w: cols, h: 1, minW: cols, maxW: cols, minH: 1, maxH: 1, isResizable: false }
    : { i, x, y, w, h, minW: 1, maxW: cols, minH: 1, maxH: MAX_ROWS_PER_TILE };

/** The layout everyone starts with (same for every building). */
export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    tile('actions', 0, 0, 4, 1, 4),
    tile('building', 0, 1, 2, 2, 4),
    tile('members', 2, 1, 2, 2, 4),
    tile('messages', 0, 3, 2, 2, 4),
    tile('apartments', 2, 3, 1, 2, 4),
    tile('docs', 3, 3, 1, 2, 4),
  ],
  md: [
    tile('actions', 0, 0, 2, 1, 2),
    tile('building', 0, 1, 2, 2, 2),
    tile('members', 0, 3, 2, 2, 2),
    tile('messages', 0, 5, 2, 2, 2),
    tile('apartments', 0, 7, 1, 2, 2),
    tile('docs', 1, 7, 1, 2, 2),
  ],
  // Phones: one column, stacked in TILE_IDS order (editing is off there).
  sm: (() => {
    const heights: Record<TileId, number> = { actions: 2, building: 2, apartments: 2, members: 2, messages: 3, docs: 2 };
    let y = 0;
    return TILE_IDS.map((id) => {
      const item = { i: id, x: 0, y, w: 1, h: heights[id], static: true };
      y += heights[id];
      return item;
    });
  })(),
};

// Device-only preferences (not synced to the account — agreed 2026-10-06).
// v2: the 4-column rectangle grid; layouts saved for the old 12-column grid are ignored.
const layoutKey = (userKey: string) => `buildy_home_layout_v2:${userKey}`;
const EDIT_KEY = 'buildy_home_layout_edit';

/** A stored layout is only used if it still has exactly the current tiles; otherwise that breakpoint uses the default. */
function isComplete(items: unknown): items is LayoutItem[] {
  if (!Array.isArray(items)) return false;
  const ids = new Set(items.map((item) => (item as LayoutItem)?.i));
  return ids.size === TILE_IDS.length && TILE_IDS.every((id) => ids.has(id));
}

/** Re-applies the size limits from the defaults (stored layouts only keep positions/sizes). */
function withLimits(items: LayoutItem[], defaults: LayoutItem[]): LayoutItem[] {
  return items.map((item) => {
    const base = defaults.find((d) => d.i === item.i)!;
    return { ...base, x: item.x, y: item.y, w: item.w, h: item.h };
  });
}

export function loadLayouts(userKey: string): ResponsiveLayouts {
  try {
    const stored = JSON.parse(localStorage.getItem(layoutKey(userKey)) ?? 'null') as Record<string, unknown> | null;
    if (!stored) return DEFAULT_LAYOUTS;
    return Object.fromEntries(
      Object.entries(DEFAULT_LAYOUTS).map(([bp, fallback]) => [
        bp,
        isComplete(stored[bp]) ? withLimits(stored[bp] as LayoutItem[], [...(fallback ?? [])]) : fallback,
      ]),
    ) as ResponsiveLayouts;
  } catch {
    return DEFAULT_LAYOUTS;
  }
}

export function saveLayouts(userKey: string, layouts: ResponsiveLayouts) {
  try {
    localStorage.setItem(layoutKey(userKey), JSON.stringify(layouts));
  } catch {
    // storage full or blocked — layout just isn't remembered
  }
}

export function resetLayouts(userKey: string) {
  try {
    localStorage.removeItem(layoutKey(userKey));
  } catch {
    // nothing stored
  }
}

export function getLayoutEditing(): boolean {
  try {
    return localStorage.getItem(EDIT_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLayoutEditing(on: boolean) {
  try {
    localStorage.setItem(EDIT_KEY, String(on));
  } catch {
    // not remembered
  }
}
