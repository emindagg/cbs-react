/**
 * Color Scheme Preview Component
 * Shows a preview of the selected color scheme
 */

import type { ColorScheme } from '../../types/visualization';

const COLOR_SCHEMES_DATA: Record<ColorScheme, string[]> = {
  viridis: [
    '#440154',
    '#472777',
    '#3b528b',
    '#2c728e',
    '#21918c',
    '#27ad81',
    '#5ec962',
    '#aadc32',
    '#fde725',
  ],
  topographic: [
    '#4a6741',
    '#7b9971',
    '#b4c8a8',
    '#e8f1e1',
    '#f6e8c3',
    '#dfc27d',
    '#bf812d',
    '#8c510a',
    '#543005',
  ],
  diverging_orange_blue: [
    '#c66b20',
    '#dd8a4b',
    '#eeaa7b',
    '#f4c9a8',
    '#dcdcdc',
    '#90b9d7',
    '#5393c3',
    '#2a6ba1',
    '#11415c',
  ],
  greens: [
    '#f7fcf5',
    '#e5f5e0',
    '#c7e9c0',
    '#a1d99b',
    '#74c476',
    '#41ab5d',
    '#238b45',
    '#006d2c',
    '#00441b',
  ],
  reds: [
    '#fff5f0',
    '#fee0d2',
    '#fcbba1',
    '#fc9272',
    '#fb6a4a',
    '#ef3b2c',
    '#cb181d',
    '#a50f15',
    '#67000d',
  ],
  blues: [
    '#f7fbff',
    '#deebf7',
    '#c6dbef',
    '#9ecae1',
    '#6baed6',
    '#4292c6',
    '#2171b5',
    '#08519c',
    '#08306b',
  ],
  oranges: [
    '#fff5eb',
    '#fee6ce',
    '#fdd0a2',
    '#fdae6b',
    '#fd8d3c',
    '#f16913',
    '#d94801',
    '#a63603',
    '#7f2704',
  ],
  purples: [
    '#fcfbfd',
    '#efedf5',
    '#dadaeb',
    '#bcbddc',
    '#9e9ac8',
    '#807dba',
    '#6a51a3',
    '#54278f',
    '#3f007d',
  ],
};

interface ColorSchemePreviewProps {
  colorScheme: ColorScheme;
}

export default function ColorSchemePreview({ colorScheme }: ColorSchemePreviewProps) {
  const colors = COLOR_SCHEMES_DATA[colorScheme];

  return (
    <div className="mt-1.5 rounded overflow-hidden shadow-sm">
      <div
        className="h-4"
        style={{
          background: `linear-gradient(to right, ${colors.join(', ')})`,
        }}
      ></div>
    </div>
  );
}
