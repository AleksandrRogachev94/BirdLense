//********** SPECTROGRAM CONSTANTS ************ */

export interface ColorScheme {
  name: string;
  fn: (value: number) => string;
  backgroundColor: string;
}

export const colorSchemes: Record<string, ColorScheme> = {
  jet: {
    name: 'Jet',
    backgroundColor: 'rgb(0, 0, 127)',
    fn: (v: number) => {
      if (v < 0.25) return `rgb(0, 0, ${Math.floor(127 + 128 * (4 * v))})`;
      if (v < 0.5) return `rgb(0, ${Math.floor(255 * (4 * (v - 0.25)))}, 255)`;
      if (v < 0.75)
        return `rgb(${Math.floor(255 * (4 * (v - 0.5)))}, 255, ${Math.floor(255 * (1 - 4 * (v - 0.5)))})`;
      return `rgb(255, ${Math.floor(255 * (1 - 4 * (v - 0.75)))}, 0)`;
    },
  },
  hot: {
    name: 'Hot',
    backgroundColor: 'rgb(0, 0, 0)',
    fn: (v: number) => {
      const val = Math.min(v * 1.5, 1);
      return `rgb(${Math.floor(255 * val)}, ${Math.floor(127 * val)}, 0)`;
    },
  },
  grayscale: {
    name: 'Grayscale',
    backgroundColor: 'rgb(0, 0, 0)',
    fn: (v: number) => {
      const intensity = Math.floor(255 * Math.pow(v, 0.5));
      return `rgb(${intensity}, ${intensity}, ${intensity})`;
    },
  },
};

export const FFT_SIZE = 2048;
export const CANVAS_HEIGHT = 400; // Match video height
export const CANVAS_WIDTH = 800;
export const SCROLL_STEP = 1;
export const SMOOTHING_TIME_CONSTANT = 0;
