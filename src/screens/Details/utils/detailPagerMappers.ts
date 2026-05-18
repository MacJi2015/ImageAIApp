import type { FeedItem } from '../../../api/services/feed';
import type { AppVideoTemplate } from '../../../api/services/template';
import type { DetailPagerItem } from '../../../store/useDetailPagerStore';
import type { RootStackParamList } from '../../../routes/types';

type DetailInitialData = NonNullable<RootStackParamList['Detail']['initialData']>;

export function feedItemToPagerItem(item: FeedItem): DetailPagerItem {
  return {
    id: item.feedId,
    source: 'feed',
    title: item.promptText ?? 'Feed',
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl,
    userName: item.nickname,
    userAvatarUrl: item.userAvatar,
    likeCount: item.likeCount ?? 0,
    viewCount: item.viewCount ?? 0,
    liked: Boolean(item.liked),
    templateIdForPrompt: item.templateId,
    templateThumbnailUrlForPrompt: item.thumbnailUrl,
  };
}

export function templateToPagerItem(template: AppVideoTemplate): DetailPagerItem {
  return {
    id: template.templateId,
    source: 'effect',
    title: template.templateName,
    videoUrl: template.previewVideoUrl,
    thumbnailUrl: template.coverImageUrl,
    likeCount: 0,
    viewCount: template.viewCount ?? 0,
    liked: false,
    templateIdForPrompt: template.templateId,
    templateThumbnailUrlForPrompt: template.coverImageUrl,
  };
}

export function initialDataToPagerItem(
  id: string,
  source: 'feed' | 'effect',
  initialData?: DetailInitialData,
): DetailPagerItem {
  return {
    id,
    source,
    title: initialData?.title,
    videoUrl: initialData?.videoUrl,
    thumbnailUrl: initialData?.thumbnailUrl,
    userName: initialData?.userName,
    userAvatarUrl: initialData?.userAvatarUrl,
    likeCount: initialData?.likeCount ?? 0,
    viewCount: initialData?.viewCount ?? 0,
    liked: initialData?.liked ?? false,
    templateIdForPrompt: initialData?.templateIdForPrompt,
    templateThumbnailUrlForPrompt: initialData?.templateThumbnailUrlForPrompt,
  };
}

export function feedItemsToPagerItems(items: FeedItem[]): DetailPagerItem[] {
  return items.map(feedItemToPagerItem);
}

export function templatesToPagerItems(templates: AppVideoTemplate[]): DetailPagerItem[] {
  return templates.map(templateToPagerItem);
}
