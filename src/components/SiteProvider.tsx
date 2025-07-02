'use client';

import { createContext, ReactNode, useContext } from 'react';

const SiteContext = createContext<{ siteName: string; announcement?: string }>({
  // 默认值
  siteName: 'WenXiTV',
  announcement:
    '本网站仅提供影视信息搜索服务，所有内容均来源于第三方网站。本站不存储任何视频资源，也不对内容的准确性、合法性或完整性承担任何责任。',
});

export const useSite = () => useContext(SiteContext);

export function SiteProvider({
  children,
  siteName,
  announcement,
}: {
  children: ReactNode;
  siteName: string;
  announcement?: string;
}) {
  return (
    <SiteContext.Provider value={{ siteName, announcement }}>
      {children}
    </SiteContext.Provider>
  );
}
