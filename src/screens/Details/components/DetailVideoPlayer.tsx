import React, { useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
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
};

export function DetailVideoPlayer({
  videoUri,
  posterUri,
  autoPlay = false,
  style,
  showPlayOverlay = true,
  bottomGradientHeight = 100,
}: DetailVideoPlayerProps) {
  const [playing, setPlaying] = useState(autoPlay);
  const hasVideo = !!videoUri;

  return (
    <View style={[styles.wrap, style]}>
      {hasVideo ? (
        <>
          <Video
            source={{ uri: videoUri! }}
            style={styles.video}
            resizeMode="cover"
            paused={!playing}
            onError={(e) => {
              __DEV__ && console.warn('[DetailVideoPlayer] video error', e);
            }}
          />
          {showPlayOverlay && (
            <TouchableOpacity
              style={styles.playOverlay}
              onPress={() => setPlaying((prev) => !prev)}
              activeOpacity={0.9}
            >
              {!playing && <PlayBtnIcon width={60} height={60} />}
            </TouchableOpacity>
          )}
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
