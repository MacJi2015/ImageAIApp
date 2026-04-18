import { Platform } from 'react-native';

function iosMajorVersion(): number {
  if (Platform.OS !== 'ios') {
    return 0;
  }
  const v = Platform.Version as string | number;
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return Math.floor(v);
  }
  const major = parseInt(String(v).split('.')[0] ?? '0', 10);
  return Number.isNaN(major) ? 0 : major;
}

/**
 * 支持「流动液体玻璃」类系统导航的 iOS：详情顶栏只保留图标，不自绘圆底。
 * 其余（低版本 iOS、Android）使用自绘毛玻璃圆钮。
 * 若实际机型版本与 Apple 定义不一致，只改下面主版本号。
 */
const IOS_LIQUID_GLASS_NAV_MIN_MAJOR = 26;

export const DETAIL_NAV_LIQUID_GLASS =
  Platform.OS === 'ios' && iosMajorVersion() >= IOS_LIQUID_GLASS_NAV_MIN_MAJOR;
