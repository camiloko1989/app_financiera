import { colors } from '@/ui/theme';

// Contraste WCAG 2.x (docs/pantallas.md §5: todos los pares texto/fondo pasan 4.5:1).
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('theme · contraste', () => {
  const pairs: [string, string, string][] = [
    ['text / surface', colors.text, colors.surface],
    ['text / bg', colors.text, colors.bg],
    ['textBody / surface', colors.textBody, colors.surface],
    ['textMuted / surface', colors.textMuted, colors.surface],
    ['textMuted / bg', colors.textMuted, colors.bg],
    ['accent / surface', colors.accent, colors.surface],
    ['onAccent / accent', colors.onAccent, colors.accent],
    ['danger', colors.danger.fg, colors.danger.bg],
    ['warning', colors.warning.fg, colors.warning.bg],
    ['success', colors.success.fg, colors.success.bg],
    ['neutral', colors.neutral.fg, colors.neutral.bg],
  ];

  test.each(pairs)('%s pasa 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
