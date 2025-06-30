'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// 客户端收藏 API
import { clearAllFavorites, getAllFavorites } from '@/lib/db.client';
import { DoubanItem } from '@/lib/types';

import CapsuleSwitch from '@/components/CapsuleSwitch';
import DemoCard from '@/components/DemoCard';
import ScrollableRow from '@/components/ScrollableRow';
import VideoCard from '@/components/VideoCard';

// 收藏夹项目类型定义
type FavoriteItem = {
  id: string;
  source: string;
  title: string;
  year: string;
  poster: string;
  episodes: number;
  source_name: string;
};

export default function HomeContents({
  hotMovies,
  hotTvShows,
}: {
  hotMovies: DoubanItem[];
  hotTvShows: DoubanItem[];
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  // 当切换到收藏夹时加载收藏数据
  useEffect(() => {
    if (activeTab !== 'favorites') return;

    (async () => {
      const all = await getAllFavorites();
      // 根据保存时间排序（从近到远）
      const sorted = Object.entries(all)
        .sort(([, a], [, b]) => b.save_time - a.save_time)
        .map(([key, fav]) => {
          const plusIndex = key.indexOf('+');
          const source = key.slice(0, plusIndex);
          const id = key.slice(plusIndex + 1);
          return {
            id,
            source,
            title: fav.title,
            year: fav.year,
            poster: fav.cover,
            episodes: fav.total_episodes,
            source_name: fav.source_name,
          } as FavoriteItem;
        });
      setFavoriteItems(sorted);
    })();
  }, [activeTab]);

  return (
    <>
      {/* 顶部 Tab 切换 */}
      <div className='mb-8 flex justify-center'>
        <CapsuleSwitch
          options={[
            { label: '首页', value: 'home' },
            { label: '收藏夹', value: 'favorites' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className='max-w-[95%] mx-auto'>
        {activeTab === 'favorites' ? (
          // 收藏夹视图
          <section className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                我的收藏
              </h2>
              {favoriteItems.length > 0 && (
                <button
                  className='text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  onClick={async () => {
                    await clearAllFavorites();
                    setFavoriteItems([]);
                  }}
                >
                  清空
                </button>
              )}
            </div>
            <div className='justify-start grid grid-cols-3 gap-x-2 gap-y-14 sm:gap-y-20 px-2 sm:grid-cols-[repeat(auto-fill,_minmax(11rem,_1fr))] sm:gap-x-8 sm:px-4'>
              {favoriteItems.map((item) => (
                <div key={item.id + item.source} className='w-full'>
                  <VideoCard {...item} from='favorites' />
                </div>
              ))}
              {favoriteItems.length === 0 && (
                <div className='col-span-full text-center text-gray-500 py-8 dark:text-gray-400'>
                  暂无收藏内容
                </div>
              )}
            </div>
          </section>
        ) : (
          // 首页视图
          <>
            {/* 热门电影 */}
            <section className='mb-8'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                  热门电影
                </h2>
                <Link
                  href='/douban?type=movie&tag=热门&title=热门电影'
                  className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  查看更多
                  <ChevronRight className='w-4 h-4 ml-1' />
                </Link>
              </div>
              <ScrollableRow>
                {hotMovies.map((movie, index) => (
                  <div
                    key={index}
                    className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                  >
                    <DemoCard
                      title={movie.title}
                      poster={movie.poster}
                      rate={movie.rate}
                    />
                  </div>
                ))}
              </ScrollableRow>
            </section>

            {/* 热门剧集 */}
            <section className='mb-8'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                  热门剧集
                </h2>
                <Link
                  href='/douban?type=tv&tag=热门&title=热门剧集'
                  className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                >
                  查看更多
                  <ChevronRight className='w-4 h-4 ml-1' />
                </Link>
              </div>
              <ScrollableRow>
                {hotTvShows.map((show, index) => (
                  <div
                    key={index}
                    className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                  >
                    <DemoCard
                      title={show.title}
                      poster={show.poster}
                      rate={show.rate}
                    />
                  </div>
                ))}
              </ScrollableRow>
            </section>
          </>
        )}
      </div>
    </>
  );
}
