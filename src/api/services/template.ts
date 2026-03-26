import { get } from '../request';

/** 官方模版（Effects TAB） */
export interface AppVideoTemplate {
  coverImageUrl: string;
  createdTime?: string;
  id: number;
  isOfficial: boolean;
  modifiedTime?: string;
  previewVideoUrl: string;
  promptText: string;
  sortOrder: number;
  status: string;
  templateId: string;
  templateName: string;
  templateType: string;
  viewCount: number;
}

/**
 * 查询官方模版列表
 * GET /facial/app/template/official
 */
export async function getOfficialTemplates(): Promise<AppVideoTemplate[]> {
  const res = await get<AppVideoTemplate[] | { list: AppVideoTemplate[] }>(
    'app/template/official',
  );
  if (Array.isArray(res)) return res;
  return (res as unknown as { entry: AppVideoTemplate[] }).entry ?? [];
}

/**
 * 查询模版详情
 * GET /facial/app/template/{templateId}
 */
export async function getTemplateDetail(
  templateId: string,
): Promise<AppVideoTemplate> {
  const res = await get<AppVideoTemplate | { entry: AppVideoTemplate }>(
    `app/template/${templateId}`,
  );
  if (res && typeof res === 'object' && 'entry' in res && (res as { entry?: AppVideoTemplate }).entry != null) {
    return (res as { entry: AppVideoTemplate }).entry;
  }
  return res as AppVideoTemplate;
}
