import { useState } from 'react';
import { niceScale, topRoundedPath } from '../utils/chartScale';

/**
 * Gráficas del análisis de obras. Mismo lenguaje visual que las del dashboard:
 * SVG propio, rejilla sólida de un paso, leyenda siempre visible, globo al pasar
 * el cursor o enfocar con teclado, y una tabla equivalente para quien prefiera
 * los números o use lector de pantalla.
 */

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const PLOT = {
  width: 760,
  height: 240,
  padTop: 18,
  padRight: 10,
  padBottom: 30,
  padLeft: 38,
};

function formatDay(value) {
  const [, month, day] = String(value).split('-');
  return `${Number(day)} ${MONTH_LABELS[Number(month) - 1] || ''}`;
}

/** Tarjeta contenedora: igual que las del dashboard. */
export function ChartCard({ title, subtitle, aside, isDark, className = '', children }) {
  return (
    <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white border-slate-200'} ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
          )}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

function TableToggle({ showTable, onToggle, isDark }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`text-xs font-semibold underline underline-offset-4 transition-colors ${
        isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {showTable ? 'Ver gráfica' : 'Ver tabla'}
    </button>
  );
}

function Tooltip({ left, top, below, isDark, children }) {
  return (
    <div
      className={`pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-lg ${
        below ? '' : '-translate-y-full'
      } ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      {children}
    </div>
  );
}

function Grid({ scale, yOf, palette }) {
  return scale.ticks.map((tick) => (
    <g key={tick}>
      <line
        x1={PLOT.padLeft}
        x2={PLOT.width - PLOT.padRight}
        y1={yOf(tick)}
        y2={yOf(tick)}
        stroke={tick === 0 ? palette.axis : palette.grid}
        strokeWidth="1"
      />
      <text
        x={PLOT.padLeft - 8}
        y={yOf(tick) + 4}
        textAnchor="end"
        fontSize="11"
        fill={palette.muted}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {tick}
      </text>
    </g>
  ));
}

/**
 * Barras por mes de una sola serie (los comentarios). `data`: [{ year, month, value }].
 */
export function MonthlyBars({ data, color, label, palette, isDark, emptyText }) {
  const [hovered, setHovered] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const plotWidth = PLOT.width - PLOT.padLeft - PLOT.padRight;
  const plotHeight = PLOT.height - PLOT.padTop - PLOT.padBottom;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const scale = niceScale(data.reduce((max, item) => Math.max(max, item.value), 0));

  const band = plotWidth / Math.max(data.length, 1);
  const columnWidth = Math.min(24, band * 0.62);
  const yOf = (value) => PLOT.padTop + plotHeight - (value / scale.top) * plotHeight;
  const xOf = (index) => PLOT.padLeft + band * index + (band - columnWidth) / 2;
  const busiest = data.reduce((best, item) => (item.value > (best?.value || 0) ? item : best), null);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="inline-flex items-center gap-2 text-xs font-medium">
          <span aria-hidden="true" className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
        </span>
        {total > 0 && <TableToggle showTable={showTable} onToggle={() => setShowTable((v) => !v)} isDark={isDark} />}
      </div>

      {total === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">{emptyText}</div>
      ) : showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <th className="py-2 pr-4 font-semibold">Mes</th>
                <th className="py-2 font-semibold text-right">{label}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {data.map((item) => (
                <tr key={`${item.year}-${item.month}`} className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <td className="py-1.5 pr-4">{`${MONTH_LABELS[item.month]} ${item.year}`}</td>
                  <td className="py-1.5 text-right font-semibold">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
            className="w-full h-auto"
            role="img"
            aria-label={`${label} por mes durante los últimos 12 meses. ${total} en total.`}
            onMouseLeave={() => setHovered(null)}
          >
            <Grid scale={scale} yOf={yOf} palette={palette} />

            {data.map((item, index) => {
              const x = xOf(index);
              const height = (item.value / scale.top) * plotHeight;
              const active = hovered === null || hovered === index;

              return (
                <g key={`${item.year}-${item.month}`}>
                  {item.value > 0 && (
                    <path d={topRoundedPath(x, yOf(item.value), columnWidth, height, 4)} fill={color} opacity={active ? 1 : 0.55} />
                  )}

                  {busiest && busiest.year === item.year && busiest.month === item.month && item.value > 0 && (
                    <text x={x + columnWidth / 2} y={yOf(item.value) - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.muted}>
                      {item.value}
                    </text>
                  )}

                  <text x={x + columnWidth / 2} y={PLOT.height - 10} textAnchor="middle" fontSize="11" fill={palette.muted}>
                    {MONTH_LABELS[item.month]}
                  </text>

                  <rect
                    x={PLOT.padLeft + band * index}
                    y={PLOT.padTop}
                    width={band}
                    height={plotHeight}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${MONTH_LABELS[item.month]} ${item.year}: ${item.value} ${label.toLowerCase()}`}
                    onMouseEnter={() => setHovered(index)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    style={{ cursor: 'default' }}
                  />
                </g>
              );
            })}
          </svg>

          {hovered !== null && data[hovered] && (() => {
            const anchorTop = (yOf(data[hovered].value) / PLOT.height) * 100;
            const below = anchorTop < 35;

            return (
              <Tooltip
                left={Math.min(88, Math.max(12, ((xOf(hovered) + columnWidth / 2) / PLOT.width) * 100))}
                top={below ? anchorTop + 3 : anchorTop - 2}
                below={below}
                isDark={isDark}
              >
                <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                  {`${MONTH_LABELS[data[hovered].month]} ${data[hovered].year}`}
                </p>
                <p className="flex items-center gap-2 whitespace-nowrap">
                  <span aria-hidden="true" className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-bold tabular-nums">{data[hovered].value}</span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{label}</span>
                </p>
              </Tooltip>
            );
          })()}
        </div>
      )}
    </>
  );
}

/**
 * Línea diaria de una métrica a la vez (vistas o "me gusta"), elegida con un
 * selector: tienen magnitudes muy distintas y en un mismo eje la más pequeña
 * quedaría aplastada contra el suelo.
 *
 * `series`: [{ date, views, likes }]. `metrics`: [{ key, label, color }].
 */
export function DailyLine({ series, metrics, palette, isDark, trackingSince }) {
  const [metricKey, setMetricKey] = useState(metrics[0].key);
  const [hovered, setHovered] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const metric = metrics.find((item) => item.key === metricKey) || metrics[0];
  const values = series.map((item) => item[metric.key] || 0);
  const total = values.reduce((sum, value) => sum + value, 0);

  const plotWidth = PLOT.width - PLOT.padLeft - PLOT.padRight;
  const plotHeight = PLOT.height - PLOT.padTop - PLOT.padBottom;
  const scale = niceScale(Math.max(...values, 0));

  const step = plotWidth / Math.max(series.length - 1, 1);
  const xOf = (index) => PLOT.padLeft + step * index;
  const yOf = (value) => PLOT.padTop + plotHeight - (value / scale.top) * plotHeight;

  const line = values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${xOf(index)} ${yOf(value)}`).join(' ');
  const area = `${line} L ${xOf(values.length - 1)} ${yOf(0)} L ${xOf(0)} ${yOf(0)} Z`;
  const labelEvery = Math.ceil(series.length / 7);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div role="group" aria-label="Métrica" className={`inline-flex rounded-lg p-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {metrics.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={item.key === metric.key}
              onClick={() => setMetricKey(item.key)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                item.key === metric.key
                  ? isDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-900 shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span aria-hidden="true" className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {total.toLocaleString('es-CO')} en el periodo
          </span>
          {total > 0 && <TableToggle showTable={showTable} onToggle={() => setShowTable((v) => !v)} isDark={isDark} />}
        </div>
      </div>

      {total === 0 ? (
        <div className="py-14 text-center text-sm text-slate-500">
          {`No hay ${metric.label.toLowerCase()} en este periodo.`}
        </div>
      ) : showTable ? (
        <div className="overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead className={isDark ? 'bg-slate-900' : 'bg-white'}>
              <tr className={`text-left text-xs uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <th className="py-2 pr-4 font-semibold sticky top-0">Día</th>
                <th className="py-2 font-semibold text-right sticky top-0">{metric.label}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[...series].reverse().map((item) => (
                <tr key={item.date} className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <td className="py-1.5 pr-4">{formatDay(item.date)}</td>
                  <td className="py-1.5 text-right font-semibold">{item[metric.key] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
            className="w-full h-auto"
            role="img"
            aria-label={`${metric.label} por día durante los últimos ${series.length} días. ${total} en total.`}
            onMouseLeave={() => setHovered(null)}
          >
            <Grid scale={scale} yOf={yOf} palette={palette} />

            <path d={area} fill={metric.color} opacity="0.12" />
            <path d={line} fill="none" stroke={metric.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

            {series.map((item, index) => (
              <g key={item.date}>
                {index % labelEvery === 0 && (
                  <text x={xOf(index)} y={PLOT.height - 10} textAnchor="middle" fontSize="11" fill={palette.muted}>
                    {formatDay(item.date)}
                  </text>
                )}

                {hovered === index && (
                  <circle cx={xOf(index)} cy={yOf(values[index])} r="4" fill={metric.color} stroke={palette.surface} strokeWidth="2" />
                )}

                <rect
                  x={xOf(index) - step / 2}
                  y={PLOT.padTop}
                  width={step}
                  height={plotHeight}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${formatDay(item.date)}: ${values[index]} ${metric.label.toLowerCase()}`}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  style={{ cursor: 'default' }}
                />
              </g>
            ))}
          </svg>

          {hovered !== null && series[hovered] && (() => {
            const anchorTop = (yOf(values[hovered]) / PLOT.height) * 100;
            const below = anchorTop < 35;

            return (
              <Tooltip
                left={Math.min(88, Math.max(12, (xOf(hovered) / PLOT.width) * 100))}
                top={below ? anchorTop + 3 : anchorTop - 2}
                below={below}
                isDark={isDark}
              >
                <p className={`font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{formatDay(series[hovered].date)}</p>
                <p className="flex items-center gap-2 whitespace-nowrap">
                  <span aria-hidden="true" className="w-3 h-0.5 rounded-full" style={{ backgroundColor: metric.color }} />
                  <span className="font-bold tabular-nums">{values[hovered]}</span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{metric.label}</span>
                </p>
              </Tooltip>
            );
          })()}
        </div>
      )}

      {trackingSince && (
        <p className="mt-4 text-[11px] text-slate-500">
          {`Registro diario activo desde el ${formatDay(trackingSince)}. Lo anterior no se midió por día.`}
        </p>
      )}
    </>
  );
}

/**
 * Lista de barras horizontales ordenadas, igual que la de géneros del dashboard.
 * `rows`: [{ key, label, value, hint }]. Si recibe `onSelect`, cada fila es un botón.
 */
export function RankedBars({ rows, color, isDark, unit = '', onSelect, emptyText = 'Sin datos todavía.' }) {
  const max = rows.reduce((top, row) => Math.max(top, row.value), 0);

  if (rows.length === 0 || max === 0) {
    return <div className="py-12 text-center text-sm text-slate-500">{emptyText}</div>;
  }

  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const width = Math.round((row.value / max) * 100);
        const body = (
          <>
            <span className="flex justify-between gap-3 text-xs font-medium">
              <span className={`truncate text-left ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{row.label}</span>
              <span className={`tabular-nums shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {row.value.toLocaleString('es-CO')}{unit}{row.hint ? ` · ${row.hint}` : ''}
              </span>
            </span>
            <span className={`block w-full h-2.5 mt-1.5 rounded-sm overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <span
                className="block h-full transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: color, borderRadius: '0 4px 4px 0' }}
              />
            </span>
          </>
        );

        return (
          <li key={row.key}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(row.key)} className="block w-full text-left rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                {body}
              </button>
            ) : (
              <div>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Gráfica de dona: cómo se reparte un total entre varias partes. Cada porción
 * lleva su valor y su porcentaje en la leyenda de al lado (el color nunca es el
 * único camino a la identidad), y al pasar el cursor o enfocar una fila el
 * centro muestra el dato de esa porción. Más de ~6 partes dejan de distinguirse,
 * así que quien la use debe agrupar la cola en "Otras".
 *
 * `slices`: [{ key, label, value }]. `colors`: un color por porción, en orden.
 * Si recibe `onSelect`, cada fila de la leyenda es un botón.
 */
export function DonutChart({ slices, colors, palette, isDark, centerLabel = 'Total', onSelect, emptyText = 'Sin datos todavía.' }) {
  const [hovered, setHovered] = useState(null);

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return <div className="py-16 text-center text-sm text-slate-500">{emptyText}</div>;
  }

  const SIZE = 200;
  const RADIUS = 78;
  const STROKE = 30;
  const circumference = 2 * Math.PI * RADIUS;
  // Un hueco de 3 px entre porciones: lo separa el fondo, no un borde dibujado.
  const gap = slices.length > 1 ? 3 : 0;

  // Cada porción empieza donde terminan las anteriores.
  const arcs = slices.map((slice, index) => {
    const before = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    const length = (slice.value / total) * circumference;

    return { ...slice, index, length: Math.max(length - gap, 0), offset: (before / total) * circumference };
  });

  const active = hovered !== null ? slices[hovered] : null;
  const percent = (value) => `${Math.round((value / total) * 100)}%`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative shrink-0 w-48 h-48 sm:w-56 sm:h-56">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`${centerLabel}: ${total}. ${slices.map((slice) => `${slice.label}, ${slice.value}`).join('; ')}.`}
          onMouseLeave={() => setHovered(null)}
        >
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={palette.grid} strokeWidth={STROKE} />

          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colors[arc.index % colors.length]}
              strokeWidth={hovered === arc.index ? STROKE + 4 : STROKE}
              strokeDasharray={`${arc.length} ${circumference - arc.length}`}
              strokeDashoffset={-arc.offset}
              opacity={hovered === null || hovered === arc.index ? 1 : 0.4}
              style={{ transition: 'opacity 150ms, stroke-width 150ms' }}
              onMouseEnter={() => setHovered(arc.index)}
            />
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-8">
          <span className="text-3xl font-extrabold tabular-nums leading-none">{(active ? active.value : total).toLocaleString('es-CO')}</span>
          <span className={`mt-1 text-[11px] leading-tight line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {active ? `${active.label} · ${percent(active.value)}` : centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1.5">
        {slices.map((slice, index) => {
          const body = (
            <span className="flex items-center gap-3 w-full">
              <span aria-hidden="true" className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className={`truncate text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{slice.label}</span>
              <span className={`ml-auto pl-3 shrink-0 text-sm tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="font-bold">{slice.value.toLocaleString('es-CO')}</span> · {percent(slice.value)}
              </span>
            </span>
          );

          const rowClasses = `flex w-full rounded-lg px-2 py-1.5 text-left transition-colors ${
            hovered === index ? (isDark ? 'bg-slate-800' : 'bg-slate-100') : ''
          }`;

          return (
            <li key={slice.key}>
              {onSelect && slice.selectable !== false ? (
                <button
                  type="button"
                  onClick={() => onSelect(slice.key)}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                  className={`${rowClasses} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500`}
                >
                  {body}
                </button>
              ) : (
                <div
                  className={rowClasses}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
