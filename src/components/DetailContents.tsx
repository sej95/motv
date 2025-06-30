/* eslint-disable react-hooks/exhaustive-deps, no-console */

'use client';

import { Heart } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { PlayRecord } from '@/lib/db.client';
import {
  generateStorageKey,
  getAllPlayRecords,
  isFavorited,
  toggleFavorite,
} from '@/lib/db.client';
import { type VideoDetail } from '@/lib/types';

export default function DetailContents({
  detail,
  source,
  id,
  fallbackTitle,
  fallbackYear,
}: {
  detail: VideoDetail;
  source: string;
  id: string;
  fallbackTitle: string;
  fallbackYear: string;
}) {
  const [playRecord, setPlayRecord] = useState<PlayRecord | null>(null);
  const [favorited, setFavorited] = useState(false);
  // 是否倒序显示选集
  const [reverseEpisodeOrder, setReverseEpisodeOrder] = useState(false);

  // 格式化剩余时间（如 1h 50m）
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (parts.length === 0) parts.push('0m');
    return parts.join(' ');
  };

  useEffect(() => {
    const checkClientSideData = async () => {
      // 获取播放记录
      const allRecords = await getAllPlayRecords();
      const key = generateStorageKey(source, id);
      setPlayRecord(allRecords[key] || null);

      // 检查收藏状态
      try {
        const fav = await isFavorited(source, id);
        setFavorited(fav);
      } catch (checkErr) {
        console.error('检查收藏状态失败:', checkErr);
      }
    };

    checkClientSideData();
  }, [source, id]);

  // 切换收藏状态
  const handleToggleFavorite = async () => {
    if (!detail) return;

    try {
      const newState = await toggleFavorite(source, id, {
        title: detail.videoInfo.title,
        source_name: detail.videoInfo.source_name,
        year: detail.videoInfo.year || fallbackYear || '',
        cover: detail.videoInfo.cover || '',
        total_episodes: detail.episodes.length || 1,
        save_time: Date.now(),
      });
      setFavorited(newState);
    } catch (err) {
      console.error('切换收藏失败:', err);
    }
  };

  return (
    <div className='flex flex-col min-h-full px-2 sm:px-10 pt-4 sm:pt-8 pb-[calc(3.5rem+env(safe-area-inset-bottom))] overflow-visible'>
      <div className='max-w-[95%] mx-auto'>
        {/* 主信息区：左图右文 */}
        <div className='relative flex flex-col md:flex-row gap-8 mb-0 sm:mb-8 bg-transparent rounded-xl p-2 sm:p-6 md:items-start'>
          {/* 返回按钮放置在主信息区左上角 */}
          <button
            onClick={() => {
              window.history.back();
            }}
            className='absolute top-0 left-0 -translate-x-[40%] -translate-y-[30%] sm:-translate-x-[180%] sm:-translate-y-1/2 p-2 rounded transition-colors'
          >
            <svg
              className='h-5 w-5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500 transition-colors'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M15 19l-7-7 7-7'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>
          {/* 封面 */}
          <div className='flex-shrink-0 w-full max-w-[200px] sm:max-w-none md:w-72 mx-auto'>
            <Image
              src={detail.videoInfo.cover || '/images/placeholder.png'}
              alt={detail.videoInfo.title || fallbackTitle}
              width={288}
              height={432}
              className='w-full rounded-xl object-cover'
              style={{ aspectRatio: '2/3' }}
              priority
            />
          </div>
          {/* 右侧信息 */}
          <div
            className='flex-1 flex flex-col min-h-0'
            style={{ height: '430px' }}
          >
            <h1 className='text-3xl font-bold mb-2 tracking-wide flex items-center flex-shrink-0 text-center md:text-left w-full'>
              {detail.videoInfo.title || fallbackTitle}
            </h1>
            <div className='flex flex-wrap items-center gap-3 text-base mb-4 opacity-80 flex-shrink-0'>
              {detail.videoInfo.remarks && (
                <span className='text-green-600 font-semibold'>
                  {detail.videoInfo.remarks}
                </span>
              )}
              {(detail.videoInfo.year || fallbackYear) && (
                <span>{detail.videoInfo.year || fallbackYear}</span>
              )}
              {detail.videoInfo.source_name && (
                <span className='border border-gray-500/60 px-2 py-[1px] rounded'>
                  {detail.videoInfo.source_name}
                </span>
              )}
              {detail.videoInfo.type && <span>{detail.videoInfo.type}</span>}
            </div>
            {/* 按钮区域 */}
            <div className='flex items-center gap-4 mb-4 flex-shrink-0'>
              {playRecord ? (
                <>
                  {/* 恢复播放 */}
                  <a
                    href={`/play?source=${source}&id=${id}&title=${encodeURIComponent(
                      detail.videoInfo.title
                    )}${
                      detail.videoInfo.year || fallbackYear
                        ? `&year=${detail.videoInfo.year || fallbackYear}`
                        : ''
                    }`}
                    className='flex items-center justify-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white'
                  >
                    <div className='w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent'></div>
                    <span>恢复播放</span>
                  </a>
                  {/* 从头开始 */}
                  <a
                    href={`/play?source=${source}&id=${id}&index=1&position=0&title=${encodeURIComponent(
                      detail.videoInfo.title
                    )}${
                      detail.videoInfo.year || fallbackYear
                        ? `&year=${detail.videoInfo.year || fallbackYear}`
                        : ''
                    }`}
                    className='hidden sm:flex items-center justify-center gap-2 px-6 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors text-white'
                  >
                    <div className='w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent'></div>
                    <span>从头开始</span>
                  </a>
                </>
              ) : (
                <>
                  {/* 播放 */}
                  <a
                    href={`/play?source=${source}&id=${id}&index=1&position=0&title=${encodeURIComponent(
                      detail.videoInfo.title
                    )}${
                      detail.videoInfo.year || fallbackYear
                        ? `&year=${detail.videoInfo.year || fallbackYear}`
                        : ''
                    }`}
                    className='flex items-center justify-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-white'
                  >
                    <div className='w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent'></div>
                    <span>播放</span>
                  </a>
                </>
              )}
              {/* 收藏按钮 */}
              <button
                onClick={handleToggleFavorite}
                className='p-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
                title={favorited ? '取消收藏' : '收藏'}
              >
                <Heart
                  className={`w-5 h-5 ${
                    favorited
                      ? 'text-red-500 fill-current'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                />
              </button>
            </div>
            {/* 简介 */}
            <div className='flex-1 overflow-y-auto text-sm opacity-90 leading-relaxed pr-2 text-justify scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600'>
              <p>{detail.videoInfo.desc}</p>
            </div>
            {/* 播放记录 */}
            {playRecord && (
              <div className='flex-shrink-0 text-xs opacity-70 mt-3'>
                上次看到: 第 {playRecord.index} 集 (剩余{' '}
                {formatDuration(playRecord.total_time - playRecord.play_time)})
              </div>
            )}
          </div>
        </div>
        {/* 选集 */}
        <div className='mt-8'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-xl font-semibold'>选集</h2>
            {detail.episodes.length > 1 && (
              <button
                onClick={() => setReverseEpisodeOrder(!reverseEpisodeOrder)}
                className='px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
              >
                {reverseEpisodeOrder ? '正序' : '倒序'}
              </button>
            )}
          </div>
          <div className='grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3'>
            {(reverseEpisodeOrder
              ? [...detail.episodes].reverse()
              : detail.episodes
            ).map((episodeInfo: string, index: number) => {
              const [episodeName, episodeUrl] = episodeInfo.split('$');
              const episodeNumber = reverseEpisodeOrder
                ? detail.episodes.length - index
                : index + 1;
              const isPlaying = playRecord?.index === episodeNumber;
              return (
                <a
                  key={episodeUrl}
                  href={`/play?source=${source}&id=${id}&index=${episodeNumber}&title=${encodeURIComponent(
                    detail.videoInfo.title
                  )}${
                    detail.videoInfo.year || fallbackYear
                      ? `&year=${detail.videoInfo.year || fallbackYear}`
                      : ''
                  }`}
                  className={`block text-center px-4 py-2 rounded-lg transition-colors truncate ${
                    isPlaying
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                  title={episodeName}
                >
                  {episodeName}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
