import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';

export interface ColumnDatum {
  /** Axis label, e.g. "Sep". */
  label: string;
  /** Tooltip heading, e.g. "September 2026". */
  fullLabel: string;
  value: number;
}

const HEIGHT = 240;
const PAD = { top: 16, right: 8, bottom: 28, left: 32 };
const MAX_BAR = 24;

/**
 * Single-series column chart in plain SVG: thin columns rounded at the data end and square at the
 * baseline, a few recessive gridlines, and a tooltip per column. Width follows the container.
 */
@Component({
  selector: 'app-column-chart',
  host: { class: 'block relative' },
  template: `
    <div #wrap class="w-full">
      <svg [attr.width]="width()" [attr.height]="height" role="img" [attr.aria-label]="ariaLabel()">
        @for (tick of ticks(); track tick) {
          <line
            [attr.x1]="pad.left"
            [attr.x2]="width() - pad.right"
            [attr.y1]="y(tick)"
            [attr.y2]="y(tick)"
            class="grid-line"
          />
          <text [attr.x]="pad.left - 8" [attr.y]="y(tick)" dy="0.32em" text-anchor="end" class="axis-text">
            {{ tick }}
          </text>
        }
        @for (d of data(); track d.fullLabel; let i = $index) {
          @if (d.value > 0) {
            <path [attr.d]="barPath(i, d.value)" class="bar" [class.bar-dim]="hovered() !== null && hovered() !== i" />
          }
          @if (showLabel(i)) {
            <text [attr.x]="cx(i)" [attr.y]="height - 8" text-anchor="middle" class="axis-text">{{ d.label }}</text>
          }
          <rect
            [attr.x]="cx(i) - band() / 2"
            [attr.y]="pad.top"
            [attr.width]="band()"
            [attr.height]="plotHeight"
            fill="transparent"
            (mouseenter)="hovered.set(i)"
            (mouseleave)="hovered.set(null)"
          />
        }
        <line
          [attr.x1]="pad.left"
          [attr.x2]="width() - pad.right"
          [attr.y1]="y(0)"
          [attr.y2]="y(0)"
          class="baseline"
        />
      </svg>
      @if (hovered() !== null) {
        @let d = data()[hovered()!];
        <div
          class="tooltip"
          [style.left.px]="cx(hovered()!)"
          [style.top.px]="y(d.value) - 8"
        >
          <div class="text-gray-500">{{ d.fullLabel }}</div>
          <div class="font-semibold text-gray-900">{{ valueText()(d.value) }}</div>
        </div>
      }
      <table class="sr-only">
        <caption>{{ ariaLabel() }}</caption>
        @for (d of data(); track d.fullLabel) {
          <tr><th scope="row">{{ d.fullLabel }}</th><td>{{ d.value }}</td></tr>
        }
      </table>
    </div>
  `,
  styles: `
    .grid-line { stroke: #eceae6; stroke-width: 1; }
    .baseline { stroke: #c9c7c1; stroke-width: 1; }
    .axis-text { fill: #6b6a66; font-size: 11px; }
    .bar { fill: #2a78d6; transition: opacity 120ms; }
    .bar-dim { opacity: 0.45; }
    .tooltip {
      position: absolute;
      transform: translate(-50%, -100%);
      pointer-events: none;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 6px 10px;
      font-size: 12px;
      white-space: nowrap;
    }
  `,
})
export class ColumnChart implements AfterViewInit, OnDestroy {
  data = input.required<ColumnDatum[]>();
  ariaLabel = input('');
  /** Formats a value for the tooltip, e.g. n => `${n} listings`. */
  valueText = input<(value: number) => string>((value) => String(value));

  readonly pad = PAD;
  readonly height = HEIGHT;
  readonly plotHeight = HEIGHT - PAD.top - PAD.bottom;

  private wrap = viewChild.required<ElementRef<HTMLDivElement>>('wrap');
  private observer?: ResizeObserver;
  width = signal(600);
  hovered = signal<number | null>(null);

  /** A "nice" axis maximum and 3-5 whole-number ticks from 0 to it. */
  private scale = computed(() => {
    const max = Math.max(1, ...this.data().map((d) => d.value));
    const rawStep = max / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.max(1, [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep)!);
    return { top: Math.ceil(max / step) * step, step };
  });

  ticks = computed(() => {
    const { top, step } = this.scale();
    const ticks: number[] = [];
    for (let v = 0; v <= top; v += step) ticks.push(v);
    return ticks;
  });

  band = computed(() => (this.width() - PAD.left - PAD.right) / Math.max(1, this.data().length));
  private barWidth = computed(() => Math.min(MAX_BAR, this.band() * 0.6));

  ngAfterViewInit() {
    this.observer = new ResizeObserver(([entry]) => this.width.set(Math.max(240, entry.contentRect.width)));
    this.observer.observe(this.wrap().nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  cx(i: number) {
    return PAD.left + this.band() * (i + 0.5);
  }

  y(value: number) {
    return PAD.top + this.plotHeight * (1 - value / this.scale().top);
  }

  /** Every label when there is room, otherwise every other one (always keeping the latest). */
  showLabel(i: number) {
    const n = this.data().length;
    return this.band() >= 36 || (n - 1 - i) % 2 === 0;
  }

  /** Column with a 4px radius on the data end and a square foot on the baseline. */
  barPath(i: number, value: number) {
    const w = this.barWidth();
    const x = this.cx(i) - w / 2;
    const top = this.y(value);
    const base = this.y(0);
    const r = Math.min(4, w / 2, base - top);
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
  }
}
