/**
 * Ayudantes de dibujo para las gráficas SVG del panel de administración. Las
 * comparten el dashboard y el análisis de obras para que las escalas y las
 * barras se vean igual en las dos pantallas.
 */

/** Tope redondo (1, 2 o 5 por potencia de diez) para que las marcas del eje sean legibles. */
export function niceScale(maxValue) {
  if (maxValue <= 0) return { top: 1, ticks: [0, 1] };

  const rough = maxValue / 3;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((value) => value >= rough)
    || 10 * magnitude;

  const top = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let value = 0; value <= top + 1e-9; value += step) ticks.push(Math.round(value));

  return { top, ticks };
}

/** Barra con las esquinas de arriba redondeadas y la base recta, apoyada en el eje. */
export function topRoundedPath(x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height));

  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    'Z',
  ].join(' ');
}
