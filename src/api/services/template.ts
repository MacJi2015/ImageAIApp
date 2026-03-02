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
}

/**
 * 查询官方模版列表
 * GET /facial/app/template/official
 */
export async function getOfficialTemplates(): Promise<AppVideoTemplate[]> {
  const res = await get<AppVideoTemplate[] | { list: AppVideoTemplate[] }>(
    'app/template/official'
  );
  if (Array.isArray(res)) return res;
  return (res as { list: AppVideoTemplate[] }).list ?? [];
}
