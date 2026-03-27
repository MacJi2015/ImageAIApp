import { get, post } from '../request';

/** Feed item 的 attributes 为 JSON 字符串，常含 userAvatar、nickname */
export type FeedUserAttributes = {
  userAvatar?: string;
  nickname?: string;
};

/**
 * 解析 feed.attributes（可能为单层或二次 JSON 字符串，如 "{\"nickname\":\"a\"}"）
 */
export function parseFeedAttributes(raw?: string | null): FeedUserAttributes {
  if (raw == null || raw === '') return {};
  try {
    let parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (!parsed || typeof parsed !== 'object') return {};
    const o = parsed as Record<string, unknown>;
    return {
      userAvatar: typeof o.userAvatar === 'string' ? o.userAvatar : undefined,
      nickname: typeof o.nickname === 'string' ? o.nickname : undefined,
    };
  } catch {
    return {};
  }
}

/** Feed 流单条 */
export interface FeedItem {
  liked?: boolean;
  attributes?: string;
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
export type FeedListResponse =
  | FeedItem[]
  | { list: FeedItem[]; pageNum?: number; pageSize?: number; total?: number };

/**
 * 查询 Feed 流列表
 * GET /facial/app/feed/list
 * 接口返回为空时使用 20 条造数
 */
export async function getFeedList(params?: {
  pageNum?: number;
  pageSize?: number;
}): Promise<{
  list: FeedItem[];
  pageNum: number;
  pageSize: number;
  total?: number;
}> {
  const pageNum = params?.pageNum ?? 1;
  const pageSize = params?.pageSize ?? 10;
  let list: FeedItem[] = [];
  let total: number | undefined;

  try {
    const res = await get<FeedListResponse>('app/feed/list', {
      params: { pageNum, pageSize },
    });
    if (Array.isArray(res)) {
      list = res;
    } else {
      const r = res as unknown as {
        entry: FeedItem[];
        pageNum?: number;
        pageSize?: number;
        total?: number;
      };
      list = r.entry ?? [];
      total = r.total;
    }
  } catch {
    list = [];
  }

  return {
    list,
    pageNum,
    pageSize,
    total,
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

/**
 * 查询 Feed 详情
 * GET /facial/app/feed/detail/{feedId}
 */
export async function getFeedDetail(feedId: string): Promise<FeedItem> {
  const res = await get<FeedItem | { entry: FeedItem }>(
    `app/feed/detail/${feedId}`,
  );
  if (
    res &&
    typeof res === 'object' &&
    'entry' in res &&
    (res as { entry?: FeedItem }).entry != null
  ) {
    return (res as { entry: FeedItem }).entry;
  }
  return res as FeedItem;
}

/**
 * 删除 Feed
 * POST /facial/app/user/deleteVideo
 */
export async function deleteVideo(id: number): Promise<boolean> {
  const res = await post(`app/user/deleteVideo`, undefined, { params: { id } });
  return (res as unknown as { entry?: boolean }).entry ?? false;
}
