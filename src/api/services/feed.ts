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
export type FeedListResponse =
  | FeedItem[]
  | { list: FeedItem[]; pageNum?: number; pageSize?: number; total?: number };

const OSS_BASE = 'https://tiantaiapp.oss-cn-hangzhou.aliyuncs.com/static/cat/';
const OSS_FIRST_FIVE: { thumbnailUrl: string; videoUrl: string }[] = [
  {
    thumbnailUrl: `${OSS_BASE}dog1.jpg`,
    videoUrl: `${OSS_BASE}dog-video1.mov`,
  },
  {
    thumbnailUrl: `${OSS_BASE}cat2.jpg`,
    videoUrl: `${OSS_BASE}cat-video2.mov`,
  },
  {
    thumbnailUrl: `${OSS_BASE}cat3.jpg`,
    videoUrl: `${OSS_BASE}cat-video3.mov`,
  },
  {
    thumbnailUrl: `${OSS_BASE}cat4.jpg`,
    videoUrl: `${OSS_BASE}cat-video4.mov`,
  },
  {
    thumbnailUrl: `${OSS_BASE}cat1.jpg`,
    videoUrl: `${OSS_BASE}cat-video1.mov`,
  },
];

/** 接口无数据时使用的 20 条造数 */
function createMockFeedList(): FeedItem[] {
  return Array.from({ length: 20 }, (_, i) => {
    const oss = i < 5 ? OSS_FIRST_FIVE[i] : null;
    return {
      id: i + 1,
      feedId: `mock-feed-${i + 1}`,
      thumbnailUrl:
        oss?.thumbnailUrl ?? `https://picsum.photos/seed/feed${i + 1}/172/224`,
      videoUrl: oss?.videoUrl,
      likeCount: Math.floor(Math.random() * 500) + 10,
      shareCount: Math.floor(Math.random() * 50),
      viewCount: Math.floor(Math.random() * 2000) + 100,
      userId: (i % 5) + 10001,
      status: 'ACTIVE',
      hasWatermark: i % 3 === 0,
      promptText: `Pet video #${i + 1}`,
      createdTime: new Date(Date.now() - i * 3600000).toISOString(),
      modifiedTime: new Date(Date.now() - i * 1800000).toISOString(),
    };
  });
}

const MOCK_FEED_LIST = createMockFeedList();

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

  if (list.length === 0) {
    const start = (pageNum - 1) * pageSize;
    list = MOCK_FEED_LIST.slice(start, start + pageSize);
    total = MOCK_FEED_LIST.length;
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
