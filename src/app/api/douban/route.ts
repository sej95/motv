import { NextResponse } from 'next/server';

import { getCacheTime } from '@/lib/config';
import { getDoubanItems } from '@/lib/server/getDoubanItems';
import { DoubanResult } from '@/lib/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // 获取并验证参数
  const type = searchParams.get('type');
  const tag = searchParams.get('tag');
  const pageSize = parseInt(searchParams.get('pageSize') || '16');
  const pageStart = parseInt(searchParams.get('pageStart') || '0');

  if (!type || !tag) {
    return NextResponse.json(
      { error: '缺少必要参数: type 或 tag' },
      { status: 400 }
    );
  }

  if (type !== 'movie' && type !== 'tv') {
    return NextResponse.json(
      { error: 'type 参数必须是 tv 或 movie' },
      { status: 400 }
    );
  }

  try {
    const list = await getDoubanItems(type, tag, pageSize, pageStart);

    const response: DoubanResult = {
      code: 200,
      message: '获取成功',
      list: list,
    };

    const cacheTime = getCacheTime();
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTime}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: '获取豆瓣数据失败', details: (error as Error).message },
      { status: 500 }
    );
  }
}
