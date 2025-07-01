import { getCacheTime } from '@/lib/config';
import { DoubanItem } from '@/lib/types';

interface DoubanApiResponse {
  subjects: Array<{
    title: string;
    cover: string;
    rate: string;
  }>;
}

// 提取的内部函数，用于获取豆瓣 API 数据
async function fetchFromApi(url: string): Promise<DoubanApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
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
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// 提取的内部函数，用于从 HTML 解析 Top250
async function fetchTop250FromHtml(url: string): Promise<DoubanItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const cacheTime = getCacheTime();

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
    const response = await fetch(url, fetchOptions);
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
    throw error;
  }
}

// 主函数，供 Server Components 和 API Routes 调用
export async function getDoubanItems(
  type: 'movie' | 'tv',
  tag: string,
  pageSize = 16,
  pageStart = 0
): Promise<DoubanItem[]> {
  try {
    if (tag === 'top250') {
      const url = `https://movie.douban.com/top250?start=${pageStart}&filter=`;
      return await fetchTop250FromHtml(url);
    }

    const url = `https://movie.douban.com/j/search_subjects?type=${type}&tag=${tag}&sort=recommend&page_limit=${pageSize}&page_start=${pageStart}`;
    const doubanData = await fetchFromApi(url);
    return doubanData.subjects.map((item) => ({
      title: item.title,
      poster: item.cover,
      rate: item.rate,
    }));
  } catch (error) {
    return []; // 发生错误时返回空数组
  }
}
