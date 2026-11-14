import { useState, type CSSProperties } from 'react'

type ChartItem = { label: string; value: number }

type MiniChartProps = {
  data: ChartItem[]
  selectedIndex?: number
  onSelect?: (index: number) => void
}

/** Weekly calories: compact rounded bars, Y-axis, and hover-only values. */
export function MiniChart({ data, selectedIndex, onSelect }: MiniChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const maximum = Math.max(2000, ...data.map(item => item.value))
  const scaleMax = Math.ceil(maximum / 500) * 500
  const ticks = Array.from({ length: 5 }, (_, index) => scaleMax * (4 - index) / 4)

  return (
    <div className="sb-mini-chart" onMouseLeave={() => setHoveredIndex(null)}>
      <style>{`
        .sb-mini-chart {
          --mc-text: #294735;
          --mc-muted: #829187;
          --mc-grid: #e9efea;
          --mc-bar: #b8cfc0;
          --mc-hover: #376b50;
          --mc-tooltip-text: #ffffff;
          flex: 1;
          min-width: 0;
          min-height: 0;
          width: 100%;
          display: flex;
          color: var(--mc-text);
          font-family: inherit;
        }
        .sb-mini-chart * { box-sizing: border-box; }
        .sb-mini-chart .mc-layout {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr) 15px;
          column-gap: 9px;
        }
        .sb-mini-chart .mc-axis {
          grid-column: 1;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-end;
          color: var(--mc-muted);
          font-size: 9px;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          padding: 1px 0;
        }
        .sb-mini-chart .mc-plot {
          grid-column: 2;
          grid-row: 1;
          position: relative;
          min-height: 0;
          min-width: 0;
        }
        .sb-mini-chart .mc-gridlines {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }
        .sb-mini-chart .mc-gridline {
          border-top: 1px solid var(--mc-grid);
          width: 100%;
        }
        .sb-mini-chart .mc-bars {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: clamp(4px, 0.7vw, 11px);
          padding: 0 4px;
        }
        .sb-mini-chart .mc-day {
          position: relative;
          min-width: 0;
          height: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          outline-offset: 2px;
        }
        .sb-mini-chart .mc-bar {
          width: min(100%, 25px);
          min-height: 3px;
          border-radius: 11px 11px 4px 4px;
          background: var(--mc-bar);
          transition: background 200ms ease, transform 200ms ease, opacity 200ms ease;
          transform-origin: bottom;
        }
        .sb-mini-chart .mc-day:hover .mc-bar,
        .sb-mini-chart .mc-day:focus-visible .mc-bar {
          background: var(--mc-hover);
          transform: scaleX(1.1);
        }
        .sb-mini-chart .mc-day[data-selected='true'] .mc-bar {
          background: var(--mc-hover);
        }
        .sb-mini-chart .mc-tooltip {
          position: absolute;
          left: 50%;
          transform: translate(-50%, 5px);
          bottom: calc(var(--mc-height) + 8px);
          padding: 5px 7px;
          border-radius: 7px;
          color: var(--mc-tooltip-text);
          background: var(--mc-hover);
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 160ms ease, transform 160ms ease;
          z-index: 5;
          font-variant-numeric: tabular-nums;
        }
        .sb-mini-chart .mc-day:hover .mc-tooltip,
        .sb-mini-chart .mc-day:focus-visible .mc-tooltip {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        .sb-mini-chart .mc-labels {
          grid-column: 2;
          grid-row: 2;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: clamp(4px, 0.7vw, 11px);
          padding: 3px 4px 0;
        }
        .sb-mini-chart .mc-label {
          text-align: center;
          font-size: 9px;
          line-height: 12px;
          color: var(--mc-muted);
        }
        .sb-mini-chart .mc-label[data-selected='true'] {
          color: var(--mc-hover);
          font-weight: 800;
        }
        html[data-theme='dark'] .sb-mini-chart,
        .dark .sb-mini-chart,
        [data-theme='dark'] .sb-mini-chart,
        .dark-mode .sb-mini-chart,
        [data-theme='dark'] .sb-reference-dashboard .sb-mini-chart {
          --mc-text: #e6f1e8;
          --mc-muted: #b3c8b9;
          --mc-grid: rgba(223, 240, 227, 0.16);
          --mc-bar: #729781;
          --mc-hover: #b7dfc1;
          --mc-tooltip-text: #193525;
        }
        @media (max-height: 800px) {
          .sb-mini-chart .mc-layout { grid-template-columns: 34px minmax(0, 1fr); column-gap: 5px; }
          .sb-mini-chart .mc-axis { font-size: 8px; }
        }
      `}</style>

      <div className="mc-layout">
        <div className="mc-axis" aria-hidden="true">
          {ticks.map((tick, index) => <span key={index}>{Math.round(tick).toLocaleString()}</span>)}
        </div>
        <div className="mc-plot">
          <div className="mc-gridlines" aria-hidden="true">
            {ticks.map((_, index) => <div key={index} className="mc-gridline" />)}
          </div>
          <div className="mc-bars">
            {data.map((item, index) => {
              const barHeight = Math.max(2, Math.min(100, item.value / scaleMax * 100))
              return (
                <button
                  type="button"
                  className="mc-day"
                  key={`${item.label}-${index}`}
                  aria-label={`${item.label}: ${Math.round(item.value)} kilocalories`}
                  aria-pressed={selectedIndex === index}
                  data-selected={selectedIndex === index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  onClick={() => onSelect?.(index)}
                  style={{ '--mc-height': `${barHeight}%` } as CSSProperties}
                >
                  <span className="mc-bar" style={{ height: `${barHeight}%` }} />
                  <span className="mc-tooltip" aria-hidden={hoveredIndex !== index}>
                    {Math.round(item.value).toLocaleString()} kcal
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="mc-labels" aria-hidden="true">
          {data.map((item, index) => (
            <span className="mc-label" data-selected={selectedIndex === index} key={`${item.label}-${index}`}>
              {item.label.slice(0, 1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
