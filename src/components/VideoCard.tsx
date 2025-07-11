import { CheckCircle, Heart, Link, PlayCircleIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { deletePlayRecord, isFavorited, toggleFavorite } from '@/lib/db.client';
import { SearchResult } from '@/lib/types';

import { ImagePlaceholder } from '@/components/ImagePlaceholder';

interface VideoCardProps {
  id?: string;
  source?: string;
  title?: string;
  poster?: string;
  episodes?: number;
  source_name?: string;
  progress?: number;
  year?: string;
  from: 'playrecord' | 'favorite' | 'search' | 'douban';
  currentEpisode?: number;
  douban_id?: string;
  onDelete?: () => void;
  rate?: string;
  items?: SearchResult[];
}

export default function VideoCard({
  id,
  title = '',
  poster = '',
  episodes,
  source,
  source_name,
  progress = 0,
  year,
  from,
  currentEpisode,
  douban_id,
  onDelete,
  rate,
  items,
}: VideoCardProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 聚合状态判断
  const isAggregate = useMemo(
    () => from === 'search' && !!items?.length,
    [from, items]
  );

  // 聚合数据处理
  const aggregateData = useMemo(() => {
    if (!isAggregate || !items) return null;

    const countMap = new Map<string | number, number>();
    const episodeCountMap = new Map<number, number>();
    const yearCountMap = new Map<string, number>();

    items.forEach((item) => {
      if (item.douban_id && item.douban_id !== 0) {
        countMap.set(item.douban_id, (countMap.get(item.douban_id) || 0) + 1);
      }
      const len = item.episodes?.length || 0;
      if (len > 0) {
        episodeCountMap.set(len, (episodeCountMap.get(len) || 0) + 1);
      }
      if (item.year?.trim()) {
        const yearStr = item.year.trim();
        yearCountMap.set(yearStr, (yearCountMap.get(yearStr) || 0) + 1);
      }
    });

    const getMostFrequent = <T extends string | number>(
      map: Map<T, number>
    ): T | undefined => {
      let maxCount = 0;
      let result: T | undefined;
      map.forEach((cnt, key) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          result = key;
        }
      });
      return result;
    };

    return {
      first: items[0],
      mostFrequentDoubanId: getMostFrequent(countMap),
      mostFrequentEpisodes: getMostFrequent(episodeCountMap) || 0,
      mostFrequentYear: getMostFrequent(yearCountMap),
    };
  }, [isAggregate, items]);

  // 实际使用的数据
  const actualTitle = aggregateData?.first.title ?? title;
  const actualPoster = aggregateData?.first.poster ?? poster;
  const actualSource = aggregateData?.first.source ?? source;
  const actualId = aggregateData?.first.id ?? id;
  const actualDoubanId = String(
    aggregateData?.mostFrequentDoubanId ?? douban_id
  );
  const actualEpisodes = aggregateData?.mostFrequentEpisodes ?? episodes;
  const actualYear = aggregateData?.mostFrequentYear ?? year;

  // 获取收藏状态
  useEffect(() => {
    if (from === 'douban' || !actualSource || !actualId) return;

    const fetchFavoriteStatus = async () => {
      try {
        setFavorited(await isFavorited(actualSource, actualId));
      } catch (err) {
        throw new Error('检查收藏状态失败');
      }
    };

    fetchFavoriteStatus();
  }, [from, actualSource, actualId]);

  // 切换收藏状态
  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (from === 'douban' || !actualSource || !actualId) return;

      try {
        const newState = await toggleFavorite(actualSource, actualId, {
          title: actualTitle,
          source_name: source_name || '',
          year: actualYear || '',
          cover: actualPoster,
          total_episodes: actualEpisodes ?? 1,
          save_time: Date.now(),
        });
        setFavorited(newState);
      } catch (err) {
        throw new Error('切换收藏状态失败');
      }
    },
    [
      from,
      actualSource,
      actualId,
      actualTitle,
      source_name,
      actualYear,
      actualPoster,
      actualEpisodes,
    ]
  );

  // 删除播放记录
  const handleDeleteRecord = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (from !== 'playrecord' || !actualSource || !actualId) return;

      try {
        await deletePlayRecord(actualSource, actualId);
        onDelete?.();
      } catch (err) {
        throw new Error('删除播放记录失败');
      }
    },
    [from, actualSource, actualId, onDelete]
  );

  // 卡片点击事件
  const handleClick = useCallback(() => {
    if (from === 'douban') {
      router.push(`/play?title=${encodeURIComponent(actualTitle.trim())}`);
    } else if (actualSource && actualId) {
      const queryParams = new URLSearchParams({
        source: actualSource,
        id: actualId,
        title: actualTitle,
        ...(actualYear && { year: actualYear }),
      });
      router.push(`/play?${queryParams.toString()}`);
    }
  }, [from, actualSource, actualId, router, actualTitle, actualYear]);

  // 配置项计算
  const config = useMemo(
    () =>
      ({
        playrecord: {
          showSourceName: true,
          showProgress: true,
          showPlayButton: true,
          showHeart: true,
          showCheckCircle: true,
          showDoubanLink: false,
          showRating: false,
        },
        favorite: {
          showSourceName: true,
          showProgress: false,
          showPlayButton: true,
          showHeart: true,
          showCheckCircle: false,
          showDoubanLink: false,
          showRating: false,
        },
        search: {
          showSourceName: true,
          showProgress: false,
          showPlayButton: true,
          showHeart: !isAggregate,
          showCheckCircle: false,
          showDoubanLink: !!actualDoubanId,
          showRating: false,
        },
        douban: {
          showSourceName: false,
          showProgress: false,
          showPlayButton: true,
          showHeart: false,
          showCheckCircle: false,
          showDoubanLink: true,
          showRating: !!rate,
        },
      }[from]),
    [from, isAggregate, actualDoubanId, rate]
  );

  return (
    <div
      className='group relative w-full rounded-lg bg-transparent transition-all duration-300ms hover:-translate-y-1 hover:scale-[1.02] cursor-pointer'
      onClick={handleClick}
    >
      {/* 海报容器 */}
      <div className='relative aspect-[2/3] overflow-hidden rounded-lg transition-all duration-300ms'>
        {/* 图片占位符 */}
        {!isLoaded && <ImagePlaceholder aspectRatio='aspect-[2/3]' />}

        {/* 主海报图（带加载动画） */}
        <Image
          src={actualPoster}
          alt={actualTitle}
          fill
          className={`object-cover transition-all duration-300ms ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 blur-sm'
          } group-hover:scale-105`}
          onLoadingComplete={() => setIsLoaded(true)}
          referrerPolicy='no-referrer'
          priority={false}
        />

        {/* 悬浮交互层 */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300ms flex items-center justify-center'>
          {/* 播放按钮 */}
          {config.showPlayButton && (
            <PlayCircleIcon
              size={52}
              strokeWidth={1}
              className='text-white transition-all duration-300ms transform hover:scale-110 hover:fill-green-500 rounded-full opacity-80 hover:opacity-100'
            />
          )}

          {/* 功能按钮组 */}
          {(config.showHeart || config.showCheckCircle) && (
            <div className='absolute bottom-3 right-3 flex items-center gap-3 transform opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300ms ease-out'>
              {config.showCheckCircle && (
                <CheckCircle
                  onClick={handleDeleteRecord}
                  size={20}
                  className='rounded-full transition-all duration-300ms transform hover:scale-110 text-white hover:stroke-green-500'
                  aria-label='标记为已看'
                />
              )}

              {config.showHeart && (
                <Heart
                  onClick={handleToggleFavorite}
                  size={20}
                  className={`rounded-full transition-all duration-300ms transform hover:scale-110 ${
                    favorited
                      ? 'fill-red-600 stroke-red-600'
                      : 'fill-transparent stroke-white hover:stroke-red-400'
                  }`}
                  aria-label={favorited ? '取消收藏' : '加入收藏'}
                />
              )}
            </div>
          )}
        </div>

        {/* 评分徽章 */}
        {config.showRating && rate && (
          <div className='absolute top-2 right-2 bg-pink-500 text-white text-xs font-bold p-1 rounded-full shadow group-hover:scale-110 transition-all duration-300ms min-w-[1.5rem] text-center'>
            {rate}
          </div>
        )}

        {/* 集数徽章 */}
        {['playrecord', 'favorite', 'search'].includes(from) &&
          actualEpisodes &&
          actualEpisodes > 1 && (
            <div className='absolute top-2 right-2 bg-green-500 text-white text-xs p-1 rounded-md shadow transform transition-all duration-300ms group-hover:scale-110 min-w-[1.5rem] text-center'>
              {currentEpisode
                ? `${currentEpisode}/${actualEpisodes}`
                : actualEpisodes}
            </div>
          )}

        {/* 豆瓣链接 */}
        {config.showDoubanLink && actualDoubanId && (
          <a
            href={`https://movie.douban.com/subject/${actualDoubanId}`}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(e) => e.stopPropagation()}
            className='absolute top-2 left-2 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300ms'
          >
            <div className='bg-green-500 text-white text-xs font-bold p-1 rounded-full flex-center shadow-md hover:bg-green-600 hover:scale-110 transition-all duration-300ms'>
              <Link size={16} />
            </div>
          </a>
        )}
      </div>

      {/* 进度条 */}
      {config.showProgress && (
        <div className='mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
          <div
            className='h-full bg-green-500 rounded-full transition-all duration-300ms'
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 标题 */}
      <span className='mt-2 block text-center text-sm font-semibold truncate text-gray-900 dark:text-gray-100 transition-colors duration-300ms group-hover:text-green-600 dark:group-hover:text-green-400'>
        {actualTitle}
      </span>

      {/* 来源名称 */}
      {config.showSourceName && source_name && (
        <span className='block text-center text-xs text-gray-500 dark:text-gray-400 mt-1 transition-all duration-300ms group-hover:text-green-500 dark:group-hover:text-green-500 group-hover:scale-105'>
          <span className='inline-block border rounded px-2 py-0.5 border-gray-500/60 dark:border-gray-400/60 transition-all duration-300ms group-hover:border-green-500/60'>
            {source_name}
          </span>
        </span>
      )}
    </div>
  );
}
