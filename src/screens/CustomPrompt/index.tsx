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
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../routes/types';
import { generateVideo } from '../../api/services/video';
import { uploadImage } from '../../api/services/upload';
import { useAppStore, useUserStore } from '../../store';
import yuanBg from '../../assets/details/yuan-bg.png';
import replaceIcon from '../../assets/details/replace-icon.png';
import GenIcon from '../../assets/details/gen-icon.svg';
import CloseIcon from '../../assets/details/close-icon.svg';
import SelectedIcon from '../../assets/details/selected-icon.svg';
import LianjieBg from '../../assets/details/lianjie-bg.svg';
import LianjieIcon from '../../assets/details/lianjie-icon.svg';

type CustomPromptRoute = RouteProp<RootStackParamList, 'CustomPrompt'>;

const COLORS = {
  bg: '#050a14',
  accent: '#00ffff',
  card: '#09111f',
  inputBg: '#0a101f',
  muted: '#3a4a65',
};

export function CustomPromptScreen() {
  const navigation = useNavigation();
  const route = useRoute<CustomPromptRoute>();
  const insets = useSafeAreaInsets();
  const openLoginModal = useAppStore((s) => s.openLoginModal);
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const { imageUri, petImageUrl: initialPetImageUrl, templateId, templateThumbnailUrl } = route.params;
  const isFromEffect = Boolean(templateId);
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

  const handleGenerate = useCallback(async () => {
    // if (!isLoggedIn) {
    //   openLoginModal();
    //   return;
    // }
    (navigation as any).navigate('GenerationInProgress', {
      taskId: 1,
      imageUri: 'https://tiantaiapp.oss-cn-hangzhou.aliyuncs.com/static/image.png',
    });
    return;
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

      (navigation as any).navigate('GenerationInProgress', {
        taskId: res.taskId,
        imageUri,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '生成失败，请重试';
      Alert.alert('提示', msg);
    } finally {
      setGenerating(false);
    }
  }, [prompt, initialPetImageUrl, imageUri, removeWatermark, templateId, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <CloseIcon width={20} height={20} style={styles.backBtnIcon} />
        </TouchableOpacity>
      </View>

      <View style={isFromEffect ? styles.imageRow : styles.imageWrap}>
        {isFromEffect ? (
          <>
            <View style={styles.effectsCard}>
              <Image
                source={{ uri: templateThumbnailUrl || 'https://picsum.photos/seed/effect/166/295' }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.effectsTag}>
                <Text style={styles.effectsTagText}>EFFECTS</Text>
              </View>
            </View>
            <View style={styles.petCard}>
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
                  <View style={styles.landscapeOverlay} pointerEvents="none" />
                </>
              )}
              <View style={styles.yourPetTag}>
                <Text style={styles.yourPetText}>YOUR PET</Text>
              </View>
              <TouchableOpacity style={styles.replaceRow} onPress={handleReplace} activeOpacity={0.8}>
                <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
                <View style={styles.replaceRowOverlay} />
                <Image source={replaceIcon} style={styles.replaceIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>
            <View style={styles.linkIconOverlay} pointerEvents="none">
              <LianjieBg width={40} height={40} />
              <View style={styles.linkIconInner}>
                <LianjieIcon width={32} height={32} />
              </View>
            </View>
          </>
        ) : (
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
                <View style={styles.landscapeOverlay} pointerEvents="none" />
              </>
            )}
            <View style={styles.yourPetTag}>
              <Text style={styles.yourPetText}>YOUR PET</Text>
            </View>
            <TouchableOpacity style={styles.replaceRow} onPress={handleReplace} activeOpacity={0.8}>
              <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={5} />
              <View style={styles.replaceRowOverlay} />
              <Image source={replaceIcon} style={styles.replaceIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        )}
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
        {removeWatermark ? (
          <SelectedIcon width={18} height={18} style={styles.checkboxIcon} />
        ) : (
          <View style={styles.checkbox} />
        )}
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
    marginBottom: 20,
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
    marginBottom: 32,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 11,
    position: 'relative',
  },
  effectsCard: {
    width: 166,
    height: 295,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.muted,
    overflow: 'hidden',
    position: 'relative',
  },
  effectsTag: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: COLORS.muted,
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 10,
  },
  effectsTagText: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.accent,
  },
  linkIconOverlay: {
    position: 'absolute',
    left: 151.5,
    top: 127.5,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  linkIconInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCard: {
    width: 166,
    height: 295,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
    overflow: 'hidden',
    position: 'relative',
  },
  landscapeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    borderRadius: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceRowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.40)',
  },
  replaceIcon: {
    height: 18,
    width: 72,
  },
  sectionTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
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
    marginBottom: 50,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.muted,
    marginRight: 8,
  },
  checkboxIcon: {
    marginRight: 8,
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
