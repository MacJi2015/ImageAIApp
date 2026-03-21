import { Dimensions } from 'react-native';

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scaleW = SCREEN_WIDTH / DESIGN_WIDTH;
const scaleH = SCREEN_HEIGHT / DESIGN_HEIGHT;

/**
 * 将设计稿（375 宽）上的尺寸转换为当前设备的实际宽度尺寸
 * 用法：width: dp(16), fontSize: dp(14) 等
 */
export function dp(size: number) {
  return size * scaleW;
}

/**
 * 将设计稿（812 高）上的尺寸转换为当前设备的实际高度尺寸
 * 用法：height: hp(120), top: hp(40) 等
 */
export function hp(size: number) {
  return size * scaleH;
}
