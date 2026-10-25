import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import type { LayoutConstraint } from 'react-grid-layout/core';

// Home-screen tiles. Order here = stacking order on phones.
export const TILE_IDS = ['building', 'apartments', 'members', 'issues', 'docs', 'payments'] as const;
export type TileId = (typeof TILE_IDS)[number];

// AWS-console-style grid: small cells, so tiles can take many shapes. Tiles pack upward and
// push each other out of the way (the library's vertical compactor).
export const BREAKPOINTS = { lg: 1100, md: 700, sm: 0 } as const;
export const COLS = { lg: 4, md: 4, sm: 1 } as const;
export const MARGIN: [number, number] = [16, 16];
/** Row height as a share of the column width — cells are wider than tall. */
const CELL_RATIO = 0.4;
const MAX_ROWS_PER_TILE = 6;
const MIN_ROWS_PER_TILE = 2;

/** Row height for a grid of the given width, so cells keep their rectangle shape at any size. */
export function rowHeightFor(width: number) {
  const cols = width >= BREAKPOINTS.lg ? COLS.lg : width >= BREAKPOINTS.md ? COLS.md : COLS.sm;
  const colWidth = (width - MARGIN[0] * (cols - 1)) / cols;
  return Math.round(Math.min(Math.max(colWidth * CELL_RATIO, 72), 120));
}

/** Smallest shapes: 2+ columns wide with 2+ rows, or a single column that is at least 3 rows tall. */
export const MIN_ROWS_ONE_COLUMN = 3;
export const minShape: LayoutConstraint = {
  name: 'minShape',
  constrainSize(_item, w, h) {
    return w < 2 ? { w, h: Math.max(h, MIN_ROWS_ONE_COLUMN) } : { w, h };
  },
};

const tile = (i: TileId, x: number, y: number, w: number, h: number, cols: number): LayoutItem => ({
  i,
  x,
  y,
  w,
  h,
  minW: 1,
  maxW: cols,
  minH: MIN_ROWS_PER_TILE,
  maxH: MAX_ROWS_PER_TILE,
});

/** The home page may grow at most this many rows beyond its default height. */
const EXTRA_ROWS = 4;

/** Most rows the page may use on a screen size (default height + 4); null where the layout is fixed (phones). */
export function maxRowsFor(breakpoint: string): number | null {
  const defaults = DEFAULT_LAYOUTS[breakpoint];
  if (!defaults || breakpoint === 'sm') return null;
  return rowsUsed(defaults) + EXTRA_ROWS;
}

/** Removes rows that no tile touches (a full empty row between widgets): everything below moves up. */
export function closeEmptyRows<T extends { y: number; h: number }>(items: T[]): T[] {
  let result = items;
  for (;;) {
    const bottom = rowsUsed(result);
    let empty = -1;
    for (let row = 0; row < bottom; row++) {
      if (!result.some((item) => item.y <= row && row < item.y + item.h)) {
        empty = row;
        break;
      }
    }
    if (empty < 0) return result;
    result = result.map((item) => (item.y > empty ? { ...item, y: item.y - 1 } : item));
  }
}

export const rowsUsed = (items: readonly { y: number; h: number }[]) => items.reduce((max, item) => Math.max(max, item.y + item.h), 0);

const overlaps = (a: LayoutItem, b: LayoutItem) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Squeezes the tiles into `maxRows` rows without overlaps: the tile being moved (`anchorId`) keeps
 * its spot and every other tile, in reading order, takes the first free spot — so tiles shuffle
 * sideways into gaps instead of piling up downward. Returns null when they can't all fit.
 */
export function fitWithin(items: LayoutItem[], cols: number, maxRows: number, anchorId?: string | null): LayoutItem[] | null {
  const anchor = items.find((item) => item.i === anchorId);
  const placed: LayoutItem[] = [];
  if (anchor) {
    if (anchor.y + anchor.h > maxRows) return null;
    placed.push({ ...anchor });
  }
  const rest = items.filter((item) => item !== anchor).sort((a, b) => a.y - b.y || a.x - b.x);
  for (const item of rest) {
    const w = Math.min(item.w, cols);
    let spot: LayoutItem | null = null;
    search: for (let y = 0; y + item.h <= maxRows; y++) {
      for (let x = 0; x + w <= cols; x++) {
        const candidate = { ...item, x, y, w };
        if (!placed.some((other) => overlaps(candidate, other))) {
          spot = candidate;
          break search;
        }
      }
    }
    if (!spot) return null;
    placed.push(spot);
  }
  return items.map((item) => placed.find((p) => p.i === item.i)!);
}

/**
 * Flips tiles left↔right. The grid library only knows left-to-right, so RTL languages render a
 * mirrored copy; layouts are always stored in LTR form (one layout for every language).
 */
export function mirrorLayouts(layouts: ResponsiveLayouts): ResponsiveLayouts {
  return Object.fromEntries(
    Object.entries(layouts).map(([bp, items]) => {
      const cols = COLS[bp as keyof typeof COLS] ?? COLS.lg;
      return [bp, (items ?? []).map((item) => ({ ...item, x: cols - item.x - item.w }))];
    }),
  ) as ResponsiveLayouts;
}

/** The layout everyone starts with (same for every building). */
export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    tile('payments', 0, 0, 2, 2, 4),
    tile('issues', 2, 0, 2, 3, 4),
    tile('building', 0, 2, 2, 3, 4),
    tile('docs', 2, 3, 2, 2, 4),
    tile('members', 0, 5, 2, 2, 4),
    tile('apartments', 2, 5, 2, 2, 4),
  ],
  md: [
    tile('payments', 0, 0, 2, 3, 4),
    tile('issues', 2, 0, 2, 4, 4),
    tile('building', 0, 3, 2, 3, 4),
    tile('docs', 2, 4, 2, 3, 4),
    tile('members', 0, 6, 2, 3, 4),
    tile('apartments', 2, 6, 2, 3, 4),
  ],
  // Phones: one column, stacked in TILE_IDS order (editing is off there).
  sm: (() => {
    const heights: Record<TileId, number> = { building: 3, apartments: 3, members: 2, issues: 4, docs: 3, payments: 3 };
    let y = 0;
    return TILE_IDS.map((id) => {
      const item = { i: id, x: 0, y, w: 1, h: heights[id], static: true };
      y += heights[id];
      return item;
    });
  })(),
};

/** Ready-made home layouts offered in the widgets menu. */
export const LAYOUT_PRESETS = ['head', 'resident', 'essentials', 'everything'] as const;
export type LayoutPreset = (typeof LAYOUT_PRESETS)[number];

/** Tiles a preset shows, in [id, x, y, w, h] form on the 4-column grid; every other tile is hidden. */
const PRESET_TILES: Record<LayoutPreset, [TileId, number, number, number, number][]> = {
  head: [
    ['payments', 0, 0, 2, 2],
    ['issues', 2, 0, 2, 2],
    ['members', 0, 2, 2, 2],
    ['docs', 2, 2, 2, 2],
    ['building', 0, 4, 4, 2],
  ],
  resident: [
    ['payments', 0, 0, 2, 2],
    ['building', 2, 0, 2, 3],
    ['issues', 0, 2, 2, 3],
    ['docs', 2, 3, 2, 2],
    ['apartments', 0, 5, 2, 2],
  ],
  essentials: [
    ['payments', 0, 0, 2, 2],
    ['building', 2, 0, 2, 3],
  ],
  everything: (DEFAULT_LAYOUTS.lg ?? []).map((item) => [item.i as TileId, item.x, item.y, item.w, item.h]),
};

/**
 * A preset as full layouts plus the tiles it hides. Hidden tiles keep a slot below the others, so
 * adding one back later still has a size to use. Phones keep their stacked layout.
 */
export function presetLayout(preset: LayoutPreset): { layouts: ResponsiveLayouts; hidden: TileId[] } {
  const shown = PRESET_TILES[preset];
  const bottom = shown.reduce((max, [, , y, , h]) => Math.max(max, y + h), 0);
  const hidden = TILE_IDS.filter((id) => !shown.some(([i]) => i === id));
  const items = [
    ...shown.map(([i, x, y, w, h]) => tile(i, x, y, w, h, COLS.lg)),
    ...hidden.map((i, n) => tile(i, (n % 2) * 2, bottom + Math.floor(n / 2) * 3, 2, 3, COLS.lg)),
  ];
  return { layouts: { ...DEFAULT_LAYOUTS, lg: items, md: items.map((item) => ({ ...item })) }, hidden };
}

// Device-only preferences (not synced to the account — agreed 2026-10-06).
// v7: compact summary tiles (2026-10-23); layouts saved for the older, taller tiles are ignored.
const layoutKey = (userKey: string) => `buildy_home_layout_v7:${userKey}`;
// v2: editing is on by default (2026-10-08) — earlier "off" choices are ignored.
const EDIT_KEY = 'buildy_home_layout_edit_v2';

/** Drops tiles that no longer exist (e.g. the old quick-actions bar) so saved arrangements survive. */
function knownTiles(items: unknown): unknown {
  return Array.isArray(items) ? items.filter((item) => TILE_IDS.includes((item as LayoutItem)?.i as TileId)) : items;
}

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
      Object.entries(DEFAULT_LAYOUTS).map(([bp, fallback]) => {
        const items = knownTiles(stored[bp]);
        return [bp, isComplete(items) ? withLimits(items, [...(fallback ?? [])]) : fallback];
      }),
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

// Tiles the user took off their home page (device-only, like the layout). Their positions stay in
// the saved layout, so adding one back puts it somewhere sensible.
const hiddenKey = (userKey: string) => `buildy_home_hidden_v1:${userKey}`;

export function loadHiddenTiles(userKey: string): TileId[] {
  try {
    const stored = JSON.parse(localStorage.getItem(hiddenKey(userKey)) ?? '[]') as unknown;
    return Array.isArray(stored) ? stored.filter((id): id is TileId => TILE_IDS.includes(id as TileId)) : [];
  } catch {
    return [];
  }
}

export function saveHiddenTiles(userKey: string, hidden: TileId[]) {
  try {
    if (hidden.length) localStorage.setItem(hiddenKey(userKey), JSON.stringify(hidden));
    else localStorage.removeItem(hiddenKey(userKey));
  } catch {
    // not remembered
  }
}

export function getLayoutEditing(): boolean {
  try {
    return localStorage.getItem(EDIT_KEY) !== 'false';
  } catch {
    return true;
  }
}

export function setLayoutEditing(on: boolean) {
  try {
    localStorage.setItem(EDIT_KEY, String(on));
  } catch {
    // not remembered
  }
}
