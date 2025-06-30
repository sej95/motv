import { Suspense } from 'react';

import { getCacheTime } from '@/lib/config';
import { DoubanItem } from '@/lib/types';

import DoubanContents from '@/components/DoubanContents';
import PageLayout from '@/components/PageLayout';

export const revalidate = getCacheTime();

interface DoubanApiResponse {
  subjects: Array<{
    title: string;
    cover: string;
    rate: string;
  }>;
}

async function fetchJsonApi(url: string): Promise<DoubanItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const cacheTime = getCacheTime();

  const fetchOptions = {
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Referer: 'https://movie.douban.com/',
      Accept: 'application/json, text/plain, */*',
    },
    next: { revalidate: cacheTime },
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data: DoubanApiResponse = await response.json();
    return data.subjects.map((item) => ({
      title: item.title,
      poster: item.cover,
      rate: item.rate,
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    return [];
  }
}

async function fetchTop250(pageStart: number): Promise<DoubanItem[]> {
  const target = `https://movie.douban.com/top250?start=${pageStart}&filter=`;
  const cacheTime = getCacheTime();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const fetchOptions = {
    signal: controller.signal,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      Referer: 'https://movie.douban.com/',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
    next: { revalidate: cacheTime },
  };

  try {
    const response = await fetch(target, fetchOptions);
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const html = await response.text();
    const moviePattern =
      /<div class="item">[\s\S]*?<img[^>]+alt="([^"]+)"[^>]*src="([^"]+)"[\s\S]*?<span class="rating_num"[^>]*>([^<]+)<\/span>[\s\S]*?<\/div>/g;
    const movies: DoubanItem[] = [];
    let match;
    while ((match = moviePattern.exec(html)) !== null) {
      movies.push({
        title: match[1],
        poster: match[2].replace(/^http:/, 'https:'),
        rate: match[3] || '',
      });
    }
    return movies;
  } catch (error) {
    clearTimeout(timeoutId);
    return [];
  }
}

async function fetchDoubanData(
  type: string,
  tag: string
): Promise<DoubanItem[]> {
  const pageSize = 25;
  const pageStart = 0;

  if (tag === 'top250') {
    return fetchTop250(pageStart);
  }

  const url = `https://movie.douban.com/j/search_subjects?type=${type}&tag=${tag}&sort=recommend&page_limit=${pageSize}&page_start=${pageStart}`;
  return fetchJsonApi(url);
}

export default async function DoubanPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const type = searchParams?.type?.toString() || 'movie';
  const tag = searchParams?.tag?.toString() || '热门';
  const title = searchParams?.title?.toString();

  const getActivePath = () => {
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('tag', tag);
    if (title) params.set('title', title);
    return `/douban?${params.toString()}`;
  };

  const initialData = await fetchDoubanData(type, tag);

  return (
    <PageLayout activePath={getActivePath()}>
      <Suspense fallback={<div>Loading...</div>}>
        <DoubanContents initialData={initialData} />
      </Suspense>
    </PageLayout>
  );
}
