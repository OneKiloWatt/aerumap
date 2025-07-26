// src/utils/imageUtils.ts
/**
 * 環境に応じた画像パスを生成する
 * ローカル: /images/... 
 * GitHub Pages: /aerumap/images/...
 */
export const getImagePath = (imagePath: string): string => {
  const publicUrl = process.env.PUBLIC_URL || '';
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${publicUrl}${normalizedPath}`;
};

/**
 * よく使用される画像パスの定数
 */
export const IMAGE_PATHS = {
  MAP: '/images/map.webp',
  ICON: '/images/icon.svg',
  STEPS: {
    CREATE: '/images/steps/step-1-create.png',
    INVITE: '/images/steps/step-2-invite.png',
    SHARE: '/images/steps/step-3-share.png',
  }
} as const;
