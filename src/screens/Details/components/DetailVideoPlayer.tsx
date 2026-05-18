import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import PlayBtnIcon from '../../../assets/details/paly-btn.svg';
import preGoodsImg from '../../../assets/details/pre-goods-img.png';

export type DetailVideoPlayerProps = {
  /** 视频地址，无则只显示封面 */
  videoUri?: string | null;
  /** 封面/占位图地址（无视频或加载前显示） */
  posterUri?: string | null;
  /** true：进入即自动播放（Feed 详情）；false：需点击播放（Effects 详情） */
  autoPlay?: boolean;
  style?: ViewStyle;
  /** 是否显示圆形播放按钮覆盖层（仅在不自动播放时生效） */
  showPlayOverlay?: boolean;
  /** 底部渐变高度（默认 100） */
  bottomGradientHeight?: number;
  /** 页面是否处于激活/聚焦状态（失焦时强制暂停） */
  isActive?: boolean;
};

export function DetailVideoPlayer({
  videoUri,
  posterUri,
  style,
  bottomGradientHeight = 100,
  isActive = true,
}: DetailVideoPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(!!videoUri);
  const hasVideo = !!videoUri;

  useEffect(() => {
    // 进入页面后默认自动播放；离开页面时强制暂停
    setPlaying(true);
    setIsVideoLoading(!!videoUri);
    return () => {
      setPlaying(false);
    };
  }, [videoUri]);

  return (
    <View style={[styles.wrap, style]}>
      {hasVideo ? (
        <>
          <Video
            source={{ uri: videoUri! }}
            style={styles.video}
            resizeMode="cover"
            poster={posterUri ?? undefined}
            posterResizeMode="cover"
            paused={!playing || !isActive}
            repeat
            onLoadStart={() => setIsVideoLoading(true)}
            onLoad={() => setIsVideoLoading(false)}
            onReadyForDisplay={() => setIsVideoLoading(false)}
            onError={(e) => {
              setIsVideoLoading(false);
              __DEV__ && console.warn('[DetailVideoPlayer] video error', e);
            }}
          />
          {isVideoLoading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#00ffff" />
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={() => setPlaying((prev) => !prev)}
            activeOpacity={0.9}
          >
            {!playing && !isVideoLoading ? <PlayBtnIcon width={60} height={60} /> : null}
          </TouchableOpacity>
        </>
      ) : (
        <Image
          source={posterUri ? { uri: posterUri } : preGoodsImg}
          style={styles.poster}
          resizeMode="cover"
        />
      )}
      <LinearGradient
        colors={['rgba(5, 10, 20, 0)', '#050a14']}
        style={[styles.bottomGradient, { height: bottomGradientHeight }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 10, 20, 0.35)',
  },
  playOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
