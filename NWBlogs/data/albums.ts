// 🛡️ 本文件由 NoWin_Blog 控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "title": "一些挺不错的照片吧",
    "cover": "/uploads/c8ffa55f36f0429bb36008454360705a.jpg",
    "description": "一些挺不错的照片吧...",
    "id": "album_1780231824861",
    "photos": [
      {
        "url": "/uploads/9a65a842e4f238ba32c6ff45df46328a.jpg"
      },
      {
        "url": "/uploads/580e71d1078e68765eb1844539fbb2b7.jpg"
      },
      {
        "url": "/uploads/6504a361187fe2cb21853694e3737cac.jpg"
      },
      {
        "url": "/uploads/a4cfebd4ac60bf1451d543acc094f2b1.jpg"
      },
      {
        "url": "/uploads/fa58c6d4288e1c942fa73072021eaa63.jpg"
      },
      {
        "url": "/uploads/7838f6e3e88a15a60fec2d0364359043.jpg"
      },
      {
        "url": "/uploads/1ce15a7d341a5d78d5ee6e61e24f7e9b.jpg"
      },
      {
        "url": "/uploads/ff0f8567e6e397e879d827a089d03936.jpg"
      },
      {
        "url": "/uploads/7139dfd9be6480a75fe139e7fd8c7d7a.jpg"
      },
      {
        "url": "/uploads/710260d512fd36cbefb5949463c6eda7.jpg"
      }
    ],
    "date": "2026-05-31"
  }
];