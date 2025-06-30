/**
 * 客户端获取视频详情的专用函数
 */
export interface VideoDetail {
  id: string;
  title: string;
  poster: string;
  episodes: string[];
  source: string;
  source_name: string;
  class?: string;
  year: string;
  desc?: string;
  type_name?: string;
}

interface FetchVideoDetailOptions {
  source: string;
  id: string;
}

export async function fetchVideoDetail({
  source,
  id,
}: FetchVideoDetailOptions): Promise<VideoDetail> {
  const response = await fetch(`/api/detail?source=${source}&id=${id}`);
  if (!response.ok) {
    throw new Error('获取详情失败');
  }
  const data = await response.json();

  // 客户端获取的数据，API返回的已经是扁平化结构
  return {
    id: data?.videoInfo?.id || id,
    title: data?.videoInfo?.title || '',
    poster: data?.videoInfo?.cover || '',
    episodes: data?.episodes || [],
    source: data?.videoInfo?.source || source,
    source_name: data?.videoInfo?.source_name || '',
    class: data?.videoInfo?.remarks || '',
    year: data?.videoInfo?.year || '',
    desc: data?.videoInfo?.desc || '',
    type_name: data?.videoInfo?.type || '',
  } as VideoDetail;
}
