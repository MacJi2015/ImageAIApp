import { get, post } from '../request';

/** Feed 流单条 */
export interface FeedItem {
  createdTime?: string;
  feedId: string;
  hasWatermark: boolean;
  id: number;
  likeCount: number;
  modifiedTime?: string;
  promptText?: string;
  shareCount: number;
  status: string;
  taskId?: string;
  templateId?: string;
  thumbnailUrl: string;
  userId: number;
  videoUrl?: string;
  viewCount: number;
}

/** Feed 列表响应（支持分页或直接数组） */
export type FeedListResponse = FeedItem[] | { list: FeedItem[]; pageNum?: number; pageSize?: number; total?: number };

/**
 * 查询 Feed 流列表
 * GET /facial/app/feed/list
 */
export async function getFeedList(params?: {
  pageNum?: number;
  pageSize?: number;
}): Promise<{ list: FeedItem[]; pageNum: number; pageSize: number; total?: number }> {
  const res = await get<FeedListResponse>('app/feed/list', {
    params: {
      pageNum: params?.pageNum ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  });
  if (Array.isArray(res)) {
    return { list: res, pageNum: 1, pageSize: res.length };
  }
  const r = res as { list: FeedItem[]; pageNum?: number; pageSize?: number; total?: number };
  return {
    list: r.list ?? [],
    pageNum: r.pageNum ?? 1,
    pageSize: r.pageSize ?? 10,
    total: r.total,
  };
}

/**
 * 点赞视频
 * POST /facial/app/feed/like/{feedId}
 */
export async function likeFeed(feedId: string): Promise<boolean> {
  return post<boolean>(`app/feed/like/${feedId}`);
}

/**
 * 取消点赞
 * POST /facial/app/feed/unlike/{feedId}
 */
export async function unlikeFeed(feedId: string): Promise<boolean> {
  return post<boolean>(`app/feed/unlike/${feedId}`);
}

/**
 * 增加浏览数
 * POST /facial/app/feed/view/{feedId}
 */
export async function viewFeed(feedId: string): Promise<void> {
  await post(`app/feed/view/${feedId}`);
}
