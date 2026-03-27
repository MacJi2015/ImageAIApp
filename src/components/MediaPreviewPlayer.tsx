import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Video from 'react-native-video';
import PlayBtnIcon from '../assets/details/paly-btn.svg';

type Props = {
  imageUri?: string;
  videoUri?: string;
  containerStyle?: ViewStyle;
  frameStyle?: ViewStyle;
  mediaStyle?: ViewStyle;
  overlayContent?: React.ReactNode;
  /** always: 始终显示按钮；pausedOrEnded: 暂停/播完显示 */
  playButtonMode?: 'always' | 'pausedOrEnded';
};

export function MediaPreviewPlayer({
  imageUri,
  videoUri,
  containerStyle,
  frameStyle,
  mediaStyle,
  overlayContent,
  playButtonMode = 'pausedOrEnded',
}: Props) {
  const [paused, setPaused] = useState(true);
  const [ended, setEnded] = useState(false);
  const hasVideo = !!videoUri;
  const videoRef = useRef<any>(null);

  useEffect(() => {
    setPaused(true);
    setEnded(false);
  }, [videoUri, imageUri]);

  const showPlayBtn =
    hasVideo &&
    (playButtonMode === 'always' || paused || ended);

  const handleTogglePlay = () => {
    if (!hasVideo) return;
    if (ended) {
      videoRef.current?.seek(0);
      setEnded(false);
      setPaused(false);
      return;
    }
    setPaused((p) => {
      const next = !p;
      if (!next) setEnded(false);
      return next;
    });
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      <TouchableOpacity
        style={[styles.frame, frameStyle]}
        onPress={handleTogglePlay}
        activeOpacity={1}
        disabled={!hasVideo}
      >
        {hasVideo ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUri! }}
            style={[styles.media, mediaStyle]}
            resizeMode="cover"
            paused={paused}
            poster={imageUri}
            posterResizeMode="cover"
            onEnd={() => {
              setPaused(true);
              setEnded(true);
            }}
            onError={(e) => {
              __DEV__ && console.warn('[MediaPreviewPlayer] video error', e);
            }}
          />
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={[styles.media, mediaStyle as any]}
            resizeMode="cover"
          />
        )}
        {overlayContent}
        {hasVideo ? (
          <View pointerEvents="none" style={styles.playBtnOverlay}>
            {showPlayBtn ? <PlayBtnIcon width={60} height={60} /> : null}
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  frame: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  playBtnOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
