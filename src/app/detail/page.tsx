import { getConfig } from '@/lib/config';
import { getVideoDetail } from '@/lib/server/getVideoDetail';

import DetailContents from '@/components/DetailContents';
import PageLayout from '@/components/PageLayout';

// 从配置中读取缓存时间，并设置为页面的 revalidate 周期
export const revalidate = getConfig().cache_time;

export default async function DetailPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const source = (searchParams.source as string) || '';
  const id = (searchParams.id as string) || '';
  const fallbackTitle = (searchParams.title as string) || '';
  const fallbackYear = (searchParams.year as string) || '';

  if (!source || !id) {
    return (
      <PageLayout activePath='/detail'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-red-500 text-center'>
            <div className='text-lg font-semibold mb-2'>加载失败</div>
            <div className='text-sm'>缺少必要的来源或ID参数</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  try {
    const detailData = await getVideoDetail(source, id);

    // 在服务端成功获取数据后，渲染 PageLayout 并将数据传递给客户端组件
    return (
      <PageLayout activePath='/detail'>
        <DetailContents
          detail={detailData}
          source={source}
          id={id}
          fallbackTitle={fallbackTitle}
          fallbackYear={fallbackYear}
        />
      </PageLayout>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : '获取详情时发生未知错误';
    return (
      <PageLayout activePath='/detail'>
        <div className='flex items-center justify-center min-h-[60vh]'>
          <div className='text-red-500 text-center'>
            <div className='text-lg font-semibold mb-2'>加载失败</div>
            <div className='text-sm'>{errorMessage}</div>
          </div>
        </div>
      </PageLayout>
    );
  }
}
