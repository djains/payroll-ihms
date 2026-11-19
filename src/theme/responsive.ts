import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Returns current window dimensions dynamically at call time
 */
const getCurrentDimensions = () => {
  return Dimensions.get('window');
};

/**
 * Width Percentage: Calculates width as a percentage of current screen width.
 */
export const wp = (percentage: number): number => {
  const { width } = getCurrentDimensions();
  return PixelRatio.roundToNearestPixel((width * percentage) / 100);
};

/**
 * Height Percentage: Calculates height as a percentage of current screen height.
 */
export const hp = (percentage: number): number => {
  const { height } = getCurrentDimensions();
  return PixelRatio.roundToNearestPixel((height * percentage) / 100);
};

/**
 * Horizontal Scale: Scales size proportionally to screen width (base 375px).
 */
export const s = (size: number): number => {
  const { width } = getCurrentDimensions();
  return PixelRatio.roundToNearestPixel((width / guidelineBaseWidth) * size);
};

/**
 * Vertical Scale: Scales size proportionally to screen height (base 812px).
 */
export const vs = (size: number): number => {
  const { height } = getCurrentDimensions();
  return PixelRatio.roundToNearestPixel((height / guidelineBaseHeight) * size);
};

/**
 * Moderate Scale: Scales size proportionally with a controlled dampening factor (0.5 default).
 * Safeguards against excessively large scaling on tablets while ensuring legibility on small phones.
 */
export const ms = (size: number, factor = 0.5): number => {
  const { width } = getCurrentDimensions();
  const scaled = (width / guidelineBaseWidth) * size;
  return PixelRatio.roundToNearestPixel(size + (scaled - size) * factor);
};

/**
 * Responsive Device Information Hook
 * Automatically re-renders components on orientation flip, fold/unfold, split-screen, or tablet resizing.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallDevice = width < 360;
  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;

  // Adaptive Grid Column Count for Dashboards & Card Lists
  let gridColumns = 2;
  if (isSmallDevice) {
    gridColumns = 1;
  } else if (isLargeTablet) {
    gridColumns = 4;
  } else if (isTablet || (isLandscape && width >= 600)) {
    gridColumns = 3;
  }

  // Adaptive max container width to prevent stretched out ugly forms on tablets
  const maxContentWidth = isTablet ? 560 : width;

  // Dynamic scaling functions bound to current layout dimensions
  const dynamicWp = (percentage: number) =>
    PixelRatio.roundToNearestPixel((width * percentage) / 100);

  const dynamicHp = (percentage: number) =>
    PixelRatio.roundToNearestPixel((height * percentage) / 100);

  const dynamicScale = (size: number) =>
    PixelRatio.roundToNearestPixel((width / guidelineBaseWidth) * size);

  const dynamicMs = (size: number, factor = 0.5) => {
    // Dampen scaling on large tablets to prevent cartoonish oversized elements
    const effectiveFactor = isTablet ? factor * 0.5 : factor;
    return PixelRatio.roundToNearestPixel(size + (dynamicScale(size) - size) * effectiveFactor);
  };

  return {
    width,
    height,
    isLandscape,
    isSmallDevice,
    isTablet,
    isLargeTablet,
    gridColumns,
    maxContentWidth,
    wp: dynamicWp,
    hp: dynamicHp,
    ms: dynamicMs,
    s: dynamicScale,
  };
};

export const dimensions = {
  get width() {
    return Dimensions.get('window').width;
  },
  get height() {
    return Dimensions.get('window').height;
  },
  get isSmallDevice() {
    return Dimensions.get('window').width < 360;
  },
  get isTablet() {
    return Dimensions.get('window').width >= 600;
  },
};
