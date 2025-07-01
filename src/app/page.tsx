import { getConfig } from '@/lib/config';
import { getDoubanItems } from '@/lib/server/getDoubanItems';

import ContinueWatching from '@/components/ContinueWatching';
import HomeContents from '@/components/HomeContents';
import PageLayout from '@/components/PageLayout';

// 从配置中读取缓存时间，并设置为页面的 revalidate 周期
export const revalidate = getConfig().cache_time;

export default async function Home() {
  // 并行获取热门电影和热门剧集
  const [hotMovies, hotTvShows] = await Promise.all([
    getDoubanItems('movie', '热门'),
    getDoubanItems('tv', '热门'),
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
