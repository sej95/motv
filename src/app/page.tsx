import { getConfig } from '@/lib/config';
import { DoubanItem, DoubanResult } from '@/lib/types';

import ContinueWatching from '@/components/ContinueWatching';
import HomeContents from '@/components/HomeContents';
import PageLayout from '@/components/PageLayout';

// 从配置中读取缓存时间，并设置为页面的 revalidate 周期
export const revalidate = getConfig().cache_time;

// 在服务端获取豆瓣数据
async function fetchDoubanData(
  type: 'movie' | 'tv',
  tag: string
): Promise<DoubanItem[]> {
  try {
    // 注意：这里需要使用绝对 URL 或在环境变量中配置 HOST
    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const response = await fetch(`${host}/api/douban?type=${type}&tag=${tag}`);

    if (response.ok) {
      const data: DoubanResult = await response.json();
      return data.list;
    }
  } catch (error) {
    // 发生错误时返回空数组，避免页面崩溃
    return [];
  }
  return [];
}

export default async function Home() {
  // 并行获取热门电影和热门剧集
  const [hotMovies, hotTvShows] = await Promise.all([
    fetchDoubanData('movie', '热门'),
    fetchDoubanData('tv', '热门'),
  ]);

  return (
    <PageLayout>
      <div className='px-2 sm:px-10 py-4 sm:py-8 overflow-visible'>
        {/* "继续观看"是一个客户端组件，可以读取本地数据 */}
        <div className='max-w-[95%] mx-auto'>
          <ContinueWatching />
        </div>

        {/* HomeContents 包含 Tab 切换等交互逻辑，也是一个客户端组件 */}
        {/* 它接收从服务端获取的数据进行展示 */}
        <HomeContents hotMovies={hotMovies} hotTvShows={hotTvShows} />
      </div>
    </PageLayout>
  );
}
