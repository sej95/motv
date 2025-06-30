'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { DoubanItem, DoubanResult } from '@/lib/types';

import DemoCard from '@/components/DemoCard';

export default function DoubanContents({
  initialData,
}: {
  initialData: DoubanItem[];
}) {
  const searchParams = useSearchParams();
  const [doubanData, setDoubanData] = useState<DoubanItem[]>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // Start from page 1 as initial data is page 0
  const [hasMore, setHasMore] = useState(initialData.length === 25);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const type = searchParams.get('type');
  const tag = searchParams.get('tag');

  // Reset state when type or tag changes
  useEffect(() => {
    setDoubanData(initialData);
    setCurrentPage(1);
    setHasMore(initialData.length === 25);
    setError(null);
  }, [initialData, type, tag]);

  // Fetch more data when currentPage changes
  useEffect(() => {
    if (currentPage > 1 && type && tag && hasMore) {
      const fetchMoreData = async () => {
        try {
          setIsLoadingMore(true);

          const response = await fetch(
            `/api/douban?type=${type}&tag=${tag}&pageSize=25&pageStart=${
              (currentPage - 1) * 25
            }`
          );

          if (!response.ok) {
            throw new Error('获取豆瓣数据失败');
          }

          const data: DoubanResult = await response.json();

          if (data.code === 200) {
            setDoubanData((prev) => [...prev, ...data.list]);
            setHasMore(data.list.length === 25);
          } else {
            throw new Error(data.message || '获取数据失败');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : '获取豆瓣数据失败');
        } finally {
          setIsLoadingMore(false);
        }
      };

      fetchMoreData();
    }
  }, [currentPage, type, tag, hasMore]);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    if (!loadingRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore]);

  const getPageTitle = () => {
    const titleParam = searchParams.get('title');
    if (titleParam) {
      return titleParam;
    }

    if (!type || !tag) return '豆瓣内容';

    const typeText = type === 'movie' ? '电影' : '电视剧';
    const tagText = tag === 'top250' ? 'Top250' : tag;

    return `${typeText} - ${tagText}`;
  };

  return (
    <div className='px-4 sm:px-10 py-4 sm:py-8 overflow-visible'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-800 mb-2 dark:text-gray-200'>
          {getPageTitle()}
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>来自豆瓣的精选内容</p>
      </div>

      <div className='max-w-[95%] mx-auto mt-8 overflow-visible'>
        {error ? (
          <div className='flex justify-center items-center h-40'>
            <div className='text-red-500 text-center'>
              <div className='text-lg font-semibold mb-2'>加载失败</div>
              <div className='text-sm'>{error}</div>
            </div>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-3 gap-x-2 gap-y-12 px-0 sm:px-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-x-8 sm:gap-y-20 sm:px-4'>
              {doubanData.map((item, index) => (
                <div key={`${item.title}-${index}`} className='w-full'>
                  <DemoCard
                    title={item.title}
                    poster={item.poster}
                    rate={item.rate}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div ref={loadingRef} className='flex justify-center mt-12 py-8'>
                {isLoadingMore && (
                  <div className='flex items-center gap-2'>
                    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-500'></div>
                    <span className='text-gray-600'>加载中...</span>
                  </div>
                )}
              </div>
            )}

            {!hasMore && doubanData.length > 0 && (
              <div className='text-center text-gray-500 py-8'>
                已加载全部内容
              </div>
            )}

            {doubanData.length === 0 && !error && (
              <div className='text-center text-gray-500 py-8'>暂无相关内容</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
