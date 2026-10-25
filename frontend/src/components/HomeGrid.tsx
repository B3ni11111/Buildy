import { memo, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MIN_ROWS_ONE_COLUMN, closeEmptyRows, fitWithin, rowsUsed } from '../utils/homeLayout';

/**
 * The home-screen tile grid, built the way the AWS console's board is: the tile you grab is moved
 * straight on the DOM by the pointer (no React render per mouse move), and React only re-renders
 * when the pointer crosses into another grid cell — and then only the tiles that actually move.
 * Everything is positioned in left-to-right coordinates; RTL is handled by the caller mirroring them.
 */
export interface GridItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

type Rect = { x: number; y: number; w: number; h: number };

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** One column wide tiles must be tall (see `MIN_ROWS_ONE_COLUMN`). */
const shape = (w: number, h: number) => ({ w, h: w < 2 ? Math.max(h, MIN_ROWS_ONE_COLUMN) : h });

/**
 * Puts `movedId` at `rect`. Tiles it overlaps are pushed to the very bottom of the grid, then every tile
 * floats up into free space above it (vertical only, like the AWS console). Returns null if that
 * would make the page longer than `maxRows` and the tiles can't be rearranged to fit.
 */
function settle(items: GridItem[], movedId: string, rect: Rect, cols: number, maxRows: number | null): GridItem[] | null {
  const moved = items.find((item) => item.i === movedId);
  if (!moved) return null;
  const placed: GridItem[] = [{ ...moved, ...rect }];
  const others = items.filter((item) => item.i !== movedId).sort((a, b) => a.y - b.y || a.x - b.x);
  const displaced: GridItem[] = [];
  for (const item of others) {
    const w = Math.min(item.w, cols);
    const kept = { ...item, x: Math.min(item.x, cols - w), w };
    if (overlaps(kept, placed[0])) displaced.push(kept);
    else placed.push(kept);
  }
  for (const item of displaced) {
    const bottom = rowsUsed(placed);
    for (let y = bottom; ; y++) {
      const candidate = { ...item, y };
      if (!placed.some((other) => overlaps(candidate, other))) {
        placed.push(candidate);
        break;
      }
    }
  }
  // Gravity, upward only: every other tile floats up into any free space above it (never sideways).
  const settled: GridItem[] = [placed[0]];
  for (const item of placed.slice(1).sort((a, b) => a.y - b.y || a.x - b.x)) {
    for (let y = 0; ; y++) {
      const candidate = { ...item, y };
      if (!settled.some((other) => overlaps(candidate, other))) {
        settled.push(candidate);
        break;
      }
    }
  }
  // No fully empty row may be left between widgets (e.g. a tile dropped far below the others).
  const closed = closeEmptyRows(settled);
  const ordered = items.map((item) => closed.find((p) => p.i === item.i)!);
  if (maxRows && rowsUsed(ordered) > maxRows) return fitWithin(ordered, cols, maxRows, movedId);
  return ordered;
}

interface CellProps {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  active: boolean;
  /** Pushed aside by the tile being moved: drawn above the untouched tiles, below the moved one. */
  pushed: boolean;
  /** Another tile is being moved: glide to the new spot instead of jumping. */
  animate: boolean;
  resizable: boolean;
  tileRadius: number;
  child: ReactNode;
}

/**
 * The resize grip: a short arc that hugs the tile's rounded bottom-right corner, like the one on the
 * iPhone's lock-screen clock. It follows the tile's corner curve from just inside it, so it never sticks out of the tile.
 */
function ResizeGrip({ id, radius }: { id: string; radius: number }) {
  const r = Math.max(radius - 8, 12); // just inside the tile's corner curve (stroke is 8px wide)
  const point = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  };
  const d = `M ${point(14)} A ${r} ${r} 0 0 1 ${point(76)}`;
  return (
    <svg
      className="home-grid-resize"
      width={radius}
      height={radius}
      viewBox={`0 0 ${radius} ${radius}`}
      style={{ position: 'absolute', right: 0, bottom: 0, overflow: 'visible', pointerEvents: 'none' }}
    >
      {/* Wide invisible stroke = comfortable thing to grab. */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={26} strokeLinecap="round" data-resize={id} style={{ pointerEvents: 'stroke' }} />
      <path d={d} fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
}

/** One tile. Memoised: while another tile is dragged, a tile only re-renders if its own box changed. */
const Cell = memo(function Cell({ id, left, top, width, height, active, pushed, animate, resizable, tileRadius, child }: CellProps) {
  return (
    <div
      className="home-grid-item"
      data-id={id}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width,
        height,
        transform: `translate(${left}px, ${top}px)`,
        zIndex: active ? 5 : pushed ? 4 : 1,
        willChange: active ? 'transform' : undefined,
        // Only the tiles being pushed aside glide; the one under the pointer never lags behind it.
        transition: animate ? 'transform 180ms ease-out' : 'none',
      }}
    >
      {child}
      {resizable && <ResizeGrip id={id} radius={tileRadius} />}
    </div>
  );
});

interface BackgroundProps {
  cols: number;
  rows: number;
  cellW: number;
  rowHeight: number;
  gap: [number, number];
  radius: number;
  covered: Rect | null;
  visible: boolean;
}

/** The empty cells behind the tiles, shown only while something is dragged or resized. */
const Background = memo(function Background({ cols, rows, cellW, rowHeight, gap, radius, covered, visible }: BackgroundProps) {
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const on = !!covered && col >= covered.x && col < covered.x + covered.w && row >= covered.y && row < covered.y + covered.h;
      cells.push(
        <div
          key={`${row}-${col}`}
          className="grid-cell"
          data-covered={on ? 'true' : undefined}
          style={{
            position: 'absolute',
            left: col * (cellW + gap[0]),
            top: row * (rowHeight + gap[1]),
            width: cellW,
            height: rowHeight,
            borderRadius: radius,
          }}
        />,
      );
    }
  }
  return (
    <div aria-hidden className="grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: visible ? 'block' : 'none' }}>
      {cells}
    </div>
  );
});

interface HomeGridProps {
  items: GridItem[];
  /** Ready-made tile contents by id (kept stable by the caller so idle tiles never re-render). */
  children: Record<string, ReactNode>;
  cols: number;
  width: number;
  rowHeight: number;
  margin: [number, number];
  /** Most rows the page may use (null = no limit). */
  maxRows: number | null;
  /** Rows of empty cells to draw behind the tiles while interacting. */
  backgroundRows: number;
  cellRadius: number;
  /** Corner radius of the tiles (px); the resize grip follows it. */
  tileRadius: number;
  editable: boolean;
  /** A widget being dragged in from the side panel. */
  external: { id: string; w: number; h: number } | null;
  /** The tiles moved: new positions for every tile, and the one the user changed. */
  onCommit: (items: GridItem[], movedId: string) => void;
  onExternalDrop: (id: string, at: { x: number; y: number }) => void;
}

export default function HomeGrid({
  items,
  children,
  cols,
  width,
  rowHeight,
  margin,
  maxRows,
  backgroundRows,
  cellRadius,
  tileRadius,
  editable,
  external,
  onCommit,
  onExternalDrop,
}: HomeGridProps) {
  const [gapX, gapY] = margin;
  const cellW = (width - gapX * (cols - 1)) / cols;
  const stepX = cellW + gapX;
  const stepY = rowHeight + gapY;

  // The layout while a tile is being moved/resized, and the cells it would cover.
  const [live, setLive] = useState<GridItem[] | null>(null);
  const [covered, setCovered] = useState<Rect | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  // Pixel box of the tile under the pointer; read on render so a re-render never fights the pointer.
  const pixelRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const session = useRef<null | { cancel: () => void }>(null);

  // Always read the latest props from inside long-lived pointer handlers.
  const latest = useRef({ items, cols, stepX, stepY, cellW, rowHeight, gapX, gapY, maxRows, onCommit });
  latest.current = { items, cols, stepX, stepY, cellW, rowHeight, gapX, gapY, maxRows, onCommit };

  useEffect(() => () => session.current?.cancel(), []);

  const shown = live ?? items;
  const boxOf = (item: GridItem) => ({
    left: item.x * stepX,
    top: item.y * stepY,
    width: item.w * cellW + (item.w - 1) * gapX,
    height: item.h * rowHeight + (item.h - 1) * gapY,
  });

  const begin = (kind: 'drag' | 'resize', id: string, event: React.PointerEvent) => {
    if (!editable || event.button > 0 || session.current) return;
    const start = latest.current.items.find((item) => item.i === id);
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!start || !el) return;
    event.preventDefault();

    const L = latest.current;
    const origin = {
      left: start.x * L.stepX,
      top: start.y * L.stepY,
      width: start.w * L.cellW + (start.w - 1) * L.gapX,
      height: start.h * L.rowHeight + (start.h - 1) * L.gapY,
    };
    const startX = event.clientX;
    const startY = event.clientY;
    let target: Rect = { x: start.x, y: start.y, w: start.w, h: start.h };
    let current: GridItem[] | null = null;
    pixelRef.current = { ...origin };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = kind === 'drag' ? 'grabbing' : 'nwse-resize';
    setActiveId(id);
    setCovered(target);

    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let next: Rect;
      if (kind === 'drag') {
        const left = Math.min(Math.max(origin.left + dx, 0), Math.max(0, width - origin.width));
        // Half a row of give past the top / page-length limit (vertical only).
        const slackY = L.stepY / 2;
        const top = Math.min(
          Math.max(origin.top + dy, -slackY),
          L.maxRows ? Math.max(0, (L.maxRows - start.h) * L.stepY) + slackY : Infinity,
        );
        pixelRef.current = { ...origin, left, top };
        el.style.transform = `translate(${left}px, ${top}px)`;
        let x = Math.min(Math.max(Math.round(left / L.stepX), 0), L.cols - start.w);
        let y = Math.max(Math.round(top / L.stepY), 0);
        if (L.maxRows) y = Math.min(y, Math.max(0, L.maxRows - start.h));
        next = { x, y, w: start.w, h: start.h };
      } else {
        // The tile may only follow the pointer within its limits: min/max size, the screen edge, the
        // page-length limit, and the "one column must be tall" rule.
        const sizeOf = (cells: number, step: number, cell: number, gap: number) => cells * cell + (cells - 1) * gap;
        const maxW = Math.min(start.maxW ?? L.cols, L.cols - start.x);
        const maxH = Math.min(start.maxH ?? Infinity, L.maxRows ? Math.max(1, L.maxRows - start.y) : Infinity);
        const rawW = origin.width + dx;
        const w = Math.min(Math.max(Math.round((rawW + L.gapX) / L.stepX), start.minW ?? 1), maxW);
        const minH = shape(w, start.minH ?? 1).h;
        const rawH = origin.height + dy;
        const h = Math.min(Math.max(Math.round((rawH + L.gapY) / L.stepY), minH), Math.max(minH, maxH));
        // Pixels: clamp to the size range (so the tile stops at its limits instead of following on).
        const pw = Math.min(Math.max(rawW, sizeOf(start.minW ?? 1, L.stepX, L.cellW, L.gapX)), sizeOf(maxW, L.stepX, L.cellW, L.gapX));
        // Vertically the tile may overshoot its limits by half a row, so it feels less stuck than sideways.
        const slackY = L.stepY / 2;
        const ph = Math.min(
          Math.max(rawH, sizeOf(minH, L.stepY, L.rowHeight, L.gapY) - slackY),
          sizeOf(Math.max(minH, maxH), L.stepY, L.rowHeight, L.gapY) + slackY,
        );
        pixelRef.current = { ...origin, width: pw, height: ph };
        el.style.width = `${pw}px`;
        el.style.height = `${ph}px`;
        next = { x: start.x, y: start.y, w, h };
      }
      if (next.x === target.x && next.y === target.y && next.w === target.w && next.h === target.h) return;
      const result = settle(L.items, id, next, L.cols, L.maxRows);
      if (!result) return; // doesn't fit on the page: keep the last good spot
      target = next;
      current = result;
      setLive(result);
      // Show where the tile will really land (it may have settled upward).
      const landed = result.find((item) => item.i === id)!;
      setCovered({ x: landed.x, y: landed.y, w: landed.w, h: landed.h });
    };

    const finish = (commit: boolean) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      session.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // Snap the tile to its cell right away so nothing flashes back to the old spot.
      const land = (commit && current?.find((item) => item.i === id)) || target;
      el.style.transform = `translate(${land.x * L.stepX}px, ${land.y * L.stepY}px)`;
      el.style.width = `${land.w * L.cellW + (land.w - 1) * L.gapX}px`;
      el.style.height = `${land.h * L.rowHeight + (land.h - 1) * L.gapY}px`;
      pixelRef.current = null;
      setActiveId(null);
      setCovered(null);
      setLive(null);
      if (commit && current) latest.current.onCommit(current, id);
    };
    const up = () => finish(true);
    const cancel = () => finish(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    session.current = { cancel };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const resize = target.closest<HTMLElement>('[data-resize]');
    if (resize) return begin('resize', resize.dataset.resize!, event);
    const handle = target.closest('.tile-drag-handle');
    const item = target.closest<HTMLElement>('.home-grid-item');
    if (handle && item) begin('drag', item.dataset.id!, event);
  };

  // --- a widget dragged in from the side panel -------------------------------------------------
  const [dropAt, setDropAt] = useState<Rect | null>(null);
  const dropFor = (event: React.DragEvent): Rect | null => {
    if (!external || !rootRef.current) return null;
    const box = rootRef.current.getBoundingClientRect();
    const w = Math.min(external.w, cols);
    const x = Math.min(Math.max(Math.round((event.clientX - box.left) / stepX - w / 2 + 0.5), 0), cols - w);
    let y = Math.max(Math.round((event.clientY - box.top) / stepY - external.h / 2 + 0.5), 0);
    if (maxRows) y = Math.min(y, Math.max(0, maxRows - external.h));
    return { x, y, w, h: external.h };
  };

  const contentRows = rowsUsed(shown);
  const rootHeight = Math.max(contentRows, 1) * stepY - gapY;
  const interacting = activeId !== null || external !== null;

  return (
    <div
      ref={rootRef}
      className="home-grid"
      data-interacting={interacting ? 'true' : 'false'}
      style={{ position: 'relative', height: rootHeight, width: '100%' }}
      onPointerDown={onPointerDown}
      onDragOver={(e) => {
        if (!external) return;
        e.preventDefault();
        const next = dropFor(e);
        setDropAt((cur) =>
          cur && next && cur.x === next.x && cur.y === next.y && cur.w === next.w && cur.h === next.h ? cur : next,
        );
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropAt(null);
      }}
      onDrop={(e) => {
        if (!external) return;
        e.preventDefault();
        const at = dropFor(e);
        setDropAt(null);
        if (at) onExternalDrop(external.id, { x: at.x, y: at.y });
      }}
    >
      <Background
        cols={cols}
        rows={Math.max(backgroundRows, contentRows)}
        cellW={cellW}
        rowHeight={rowHeight}
        gap={margin}
        radius={cellRadius}
        covered={covered ?? (external ? dropAt : null)}
        visible={interacting}
      />
      {shown.map((item) => {
        const isPushed = (it: GridItem) => {
          const before = items.find((o) => o.i === it.i);
          return !!before && (before.x !== it.x || before.y !== it.y || before.w !== it.w || before.h !== it.h);
        };
        const active = item.i === activeId;
        const box = active && pixelRef.current ? pixelRef.current : boxOf(item);
        return (
          <Cell
            key={item.i}
            id={item.i}
            left={box.left}
            top={box.top}
            width={box.width}
            height={box.height}
            active={active}
            pushed={!active && live !== null && isPushed(item)}
            animate={activeId !== null && !active}
            resizable={editable}
            tileRadius={tileRadius}
            child={children[item.i]}
          />
        );
      })}
    </div>
  );
}
