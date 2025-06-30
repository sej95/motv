import { redirect } from 'next/navigation';

import { API_CONFIG, ApiSite, getApiSites, getConfig } from '@/lib/config';
import { SearchResult } from '@/lib/types';
import { cleanHtmlTags } from '@/lib/utils';

import AggregateContents from '@/components/AggregateContents';
import PageLayout from '@/components/PageLayout';

const cache_time = getConfig().cache_time || 600;
export const revalidate = cache_time;

// 根据环境变量决定最大搜索页数，默认 5
const MAX_SEARCH_PAGES: number =
  Number(process.env.NEXT_PUBLIC_SEARCH_MAX_PAGE) || 5;

interface ApiSearchItem {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks?: string;
  vod_play_url?: string;
  vod_class?: string;
  vod_year?: string;
  vod_content?: string;
  type_name?: string;
}

async function searchFromApi(
  apiSite: ApiSite,
  query: string
): Promise<SearchResult[]> {
  try {
    const apiBaseUrl = apiSite.api;
    const apiUrl =
      apiBaseUrl + API_CONFIG.search.path + encodeURIComponent(query);
    const apiName = apiSite.name;

    // 添加超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(apiUrl, {
      headers: API_CONFIG.search.headers,
      signal: controller.signal,
      next: { revalidate: cache_time },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (
      !data ||
      !data.list ||
      !Array.isArray(data.list) ||
      data.list.length === 0
    ) {
      return [];
    }
    // 处理第一页结果
    const results = data.list.map((item: ApiSearchItem) => {
      let episodes: string[] = [];

      // 使用正则表达式从 vod_play_url 提取 m3u8 链接
      if (item.vod_play_url) {
        const m3u8Regex = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
        // 先用 $$$ 分割
        const vod_play_url_array = item.vod_play_url.split('$$$');
        // 对每个分片做匹配，取匹配到最多的作为结果
        vod_play_url_array.forEach((url: string) => {
          const matches = url.match(m3u8Regex) || [];
          if (matches.length > episodes.length) {
            episodes = matches;
          }
        });
      }

      episodes = Array.from(new Set(episodes)).map((link: string) => {
        link = link.substring(1); // 去掉开头的 $
        const parenIndex = link.indexOf('(');
        return parenIndex > 0 ? link.substring(0, parenIndex) : link;
      });

      return {
        id: item.vod_id,
        title: item.vod_name,
        poster: item.vod_pic,
        episodes,
        source: apiSite.key,
        source_name: apiName,
        class: item.vod_class,
        year: item.vod_year ? item.vod_year.match(/\d{4}/)?.[0] || '' : '',
        desc: cleanHtmlTags(item.vod_content || ''),
        type_name: item.type_name,
      };
    });

    // 获取总页数
    const pageCount = data.pagecount || 1;
    // 确定需要获取的额外页数
    const pagesToFetch = Math.min(pageCount - 1, MAX_SEARCH_PAGES - 1);

    // 如果有额外页数，获取更多页的结果
    if (pagesToFetch > 0) {
      const additionalPagePromises = [];

      for (let page = 2; page <= pagesToFetch + 1; page++) {
        const pageUrl =
          apiBaseUrl +
          API_CONFIG.search.pagePath
            .replace('{query}', encodeURIComponent(query))
            .replace('{page}', page.toString());

        const pagePromise = (async () => {
          try {
            const pageController = new AbortController();
            const pageTimeoutId = setTimeout(
              () => pageController.abort(),
              8000
            );

            const pageResponse = await fetch(pageUrl, {
              headers: API_CONFIG.search.headers,
              signal: pageController.signal,
              next: { revalidate: cache_time },
            });

            clearTimeout(pageTimeoutId);

            if (!pageResponse.ok) return [];

            const pageData = await pageResponse.json();

            if (!pageData || !pageData.list || !Array.isArray(pageData.list))
              return [];

            return pageData.list.map((item: ApiSearchItem) => {
              let episodes: string[] = [];

              // 使用正则表达式从 vod_play_url 提取 m3u8 链接
              if (item.vod_play_url) {
                const m3u8Regex = /\$(https?:\/\/[^"'\s]+?\.m3u8)/g;
                episodes = item.vod_play_url.match(m3u8Regex) || [];
              }

              episodes = Array.from(new Set(episodes)).map((link: string) => {
                link = link.substring(1); // 去掉开头的 $
                const parenIndex = link.indexOf('(');
                return parenIndex > 0 ? link.substring(0, parenIndex) : link;
              });

              return {
                id: item.vod_id,
                title: item.vod_name,
                poster: item.vod_pic,
                episodes,
                source: apiSite.key,
                source_name: apiName,
                class: item.vod_class,
                year: item.vod_year
                  ? item.vod_year.match(/\d{4}/)?.[0] || ''
                  : '',
                desc: cleanHtmlTags(item.vod_content || ''),
                type_name: item.type_name,
              };
            });
          } catch (error) {
            return [];
          }
        })();

        additionalPagePromises.push(pagePromise);
      }

      // 等待所有额外页的结果
      const additionalResults = await Promise.all(additionalPagePromises);

      // 合并所有页的结果
      additionalResults.forEach((pageResults) => {
        if (pageResults.length > 0) {
          results.push(...pageResults);
        }
      });
    }

    return results;
  } catch (error) {
    return [];
  }
}

async function fetchAllSearchResults(query: string): Promise<SearchResult[]> {
  const apiSites = getApiSites();
  const searchPromises = apiSites.map((site) => searchFromApi(site, query));
  const results = await Promise.all(searchPromises);
  return results.flat();
}

export default async function AggregatePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const query = searchParams?.q?.toString().trim() || '';
  const title = searchParams?.title?.toString().trim() || '';
  const year = searchParams?.year?.toString().trim() || '';

  if (!query) {
    return (
      <PageLayout activePath='/aggregate'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-red-500 text-center'>
            <div className='text-lg font-semibold mb-2'>缺少搜索关键词</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const all = await fetchAllSearchResults(query);
  const map = new Map<string, SearchResult[]>();
  all.forEach((r) => {
    // 根据传入参数进行精确匹配：
    // 1. 如果提供了 title，则按 title 精确匹配，否则按 query 精确匹配；
    // 2. 如果还提供了 year，则额外按 year 精确匹配。
    const titleMatch = title ? r.title === title : r.title === query;
    const yearMatch = year ? r.year === year : true;
    if (!titleMatch || !yearMatch) {
      return;
    }
    const key = `${r.title}-${r.year}`;
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  });

  if (map.size > 1) {
    // 存在多个匹配，跳转到搜索页
    redirect(`/search?q=${encodeURIComponent(query)}`);
  }

  const results = Array.from(map.values()).flat();

  if (results.length === 0) {
    return (
      <PageLayout activePath='/aggregate'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-gray-500 text-center'>
            <div className='text-lg font-semibold mb-2'>未找到匹配结果</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout activePath='/aggregate'>
      <AggregateContents results={results} query={query} title={title} />
    </PageLayout>
  );
}
