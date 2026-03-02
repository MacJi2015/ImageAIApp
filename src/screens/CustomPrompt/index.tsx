import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import { generateVideo, getVideoTaskStatus } from '../../api/services/video';
import { uploadImage } from '../../api/services/upload';
import { useAppStore, useUserStore } from '../../store';
import arrowLeft from '../../assets/details/arrow-left.png';
import yuanBg from '../../assets/details/yuan-bg.png';
import GenIcon from '../../assets/details/gen-icon.svg';

type CustomPromptRoute = RouteProp<RootStackParamList, 'CustomPrompt'>;

const COLORS = {
  bg: '#050a14',
  accent: '#00ffff',
  card: '#09111f',
  inputBg: '#0a101f',
  muted: '#3a4a65',
};

const POLL_INTERVAL = 3000;

export function CustomPromptScreen() {
  const navigation = useNavigation();
  const route = useRoute<CustomPromptRoute>();
  const insets = useSafeAreaInsets();
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const { imageUri, petImageUrl: initialPetImageUrl, templateId } = route.params;
  const [prompt, setPrompt] = useState(
    'Cinematic space explorer cat, high-fidelity astronaut suit, glowing nebula background, 8k resolution, photorealistic.Cinematic.'
  );
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => setIsPortrait(height >= width),
      () => {}
    );
  }, [imageUri]);

  const handleReplace = () => {
    navigation.goBack();
  };

  const pollTaskStatus = useCallback(
    async (taskId: string): Promise<string | null> => {
      const task = await getVideoTaskStatus(taskId);
      if (task.status === 'SUCCESS' && task.videoUrl) {
        return task.videoUrl;
      }
      if (task.status === 'FAILED') {
        throw new Error(task.errorMessage ?? '生成失败');
      }
      return null;
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (!prompt.trim()) {
      Alert.alert('提示', '请输入 Additional Prompts');
      return;
    }

    let petImageUrl = initialPetImageUrl;
    if (!petImageUrl) {
      try {
        const result = await uploadImage(imageUri, 'pet');
        petImageUrl = result.url;
      } catch {
        Alert.alert('提示', '图片上传失败，请重试');
        return;
      }
    }

    setGenerating(true);
    try {
      const res = await generateVideo({
        actionType: templateId ? templateId : 'default',
        duration: 5,
        petImageUrl,
        promptText: prompt.trim(),
        removeWatermark,
        shareToCommunity: false,
        templateId,
      });

      let videoUrl: string | null = null;
      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise<void>((resolve) => setTimeout(() => resolve(), POLL_INTERVAL));
        videoUrl = await pollTaskStatus(res.taskId);
        if (videoUrl) break;
      }

      if (videoUrl) {
        (navigation as any).navigate('GenerateVideo', {
          imageUri,
          videoUri: videoUrl,
        });
      } else {
        Alert.alert('提示', '生成超时，请稍后在「My」中查看');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试';
      Alert.alert('提示', msg);
    } finally {
      setGenerating(false);
    }
  }, [
    isLoggedIn,
    openLoginModal,
    prompt,
    initialPetImageUrl,
    imageUri,
    removeWatermark,
    templateId,
    navigation,
    pollTaskStatus,
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Image source={yuanBg} style={styles.backBtnBg} resizeMode="cover" />
          <Image source={arrowLeft} style={styles.backBtnIcon} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageWrap}>
        <View style={styles.imageFrame}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          {isPortrait ? (
            <>
              <LinearGradient
                colors={['rgba(5,10,20,0.98)', 'rgba(5,10,20,0.5)', 'transparent']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.blurLeft}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['transparent', 'rgba(5,10,20,0.5)', 'rgba(5,10,20,0.98)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.blurRight}
                pointerEvents="none"
              />
            </>
          ) : (
            <>
              <LinearGradient
                colors={['rgba(5,10,20,0.98)', 'rgba(5,10,20,0.5)', 'transparent']}
                locations={[0, 0.5, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.blurTop}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['transparent', 'rgba(5,10,20,0.5)', 'rgba(5,10,20,0.98)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.blurBottom}
                pointerEvents="none"
              />
            </>
          )}
          <View style={styles.yourPetTag}>
            <Text style={styles.yourPetText}>Your Pet</Text>
          </View>
          <TouchableOpacity style={styles.replaceRow} onPress={handleReplace} activeOpacity={0.8}>
            <Text style={styles.replaceText}>Replace</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>*Additional Prompts(Required)</Text>
      <TextInput
        style={styles.promptInput}
        value={prompt}
        onChangeText={setPrompt}
        placeholderTextColor={COLORS.muted}
        multiline
      />

      <TouchableOpacity
        style={styles.watermarkRow}
        onPress={() => setRemoveWatermark((v) => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, removeWatermark && styles.checkboxChecked]} />
        <Text style={styles.watermarkText}>Remove Watermark</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
        onPress={handleGenerate}
        activeOpacity={0.8}
        disabled={generating}
      >
        {generating ? (
          <>
            <ActivityIndicator size="small" color="#020410" />
            <Text style={styles.generateBtnText}>生成中...</Text>
          </>
        ) : (
          <>
            <GenIcon width={24} height={24} />
            <Text style={styles.generateBtnText}>GENERATE</Text>
          </>
        )}
      </TouchableOpacity>
      <View style={styles.chancesRow}>
        <View style={styles.chanceDot} />
        <Text style={styles.chancesText}>3 Free Chances Remaining</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnBg: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  backBtnIcon: {
    width: 20,
    height: 20,
  },
  imageWrap: {
    alignSelf: 'center',
    width: 343,
    height: 295,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 12,
    overflow: 'hidden',
  },
  blurLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 110,
  },
  blurRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 110,
  },
  blurTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 105,
  },
  blurBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 105,
  },
  imageFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  yourPetTag: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 10,
  },
  yourPetText: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.bg,
  },
  replaceRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  promptInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(58,74,101,0.8)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 12,
    color: COLORS.muted,
    minHeight: 180,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  watermarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.muted,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  watermarkText: {
    fontSize: 14,
    color: '#ffffff',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 343,
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020410',
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  chancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  chanceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  chancesText: {
    fontSize: 10,
    color: COLORS.accent,
  },
});
