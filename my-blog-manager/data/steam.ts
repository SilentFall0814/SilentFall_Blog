// 🛡️ 本文件由控制台自动生成，请勿手动修改

export type GameStatus = 'not_installed' | 'installed' | 'completed' | 'perfect';

export type SteamGame = {
  id: string;
  title: string;
  cover: string;
  status: GameStatus;
  purchaseDate: string;
  storeLink: string;
  playtime: string;
};

export const steamGamesData: SteamGame[] = [
  {
    "id": "game_1780229270219",
    "title": "Wallpaper Engine",
    "cover": "/uploads/c9a9a2911795f0420eaf0371cfd09e3c.png",
    "status": "installed",
    "purchaseDate": "2023-10-01",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780229176310",
    "title": "黑神话：悟空",
    "cover": "/uploads/25cee3adc138ed701d12bebda0a249c7.png",
    "status": "installed",
    "purchaseDate": "2024-09-29",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780229124004",
    "title": "MyDockFinder",
    "cover": "/uploads/d72628242822454c8f27a9c73a60c75f.png",
    "status": "installed",
    "purchaseDate": "2024-09-30",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780229084937",
    "title": "WRC 7",
    "cover": "/uploads/07d55abffba866cf9b3ea50accf2bf1e.png",
    "status": "installed",
    "purchaseDate": "2024-11-19",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780229043820",
    "title": "极限竞速：地平线4",
    "cover": "/uploads/cbd292b6b15c8c09686348814f38c46d.png",
    "status": "installed",
    "purchaseDate": "2024-12-10",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780228952056",
    "title": "WRC 10 FIA World Rally Championship (ASIA)",
    "cover": "/uploads/de18192e5d5f7066816206ddfefb1b82.png",
    "status": "installed",
    "purchaseDate": "2024-12-14",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780228907913",
    "title": "极限竞速：地平线 5 顶级版",
    "cover": "/uploads/ca9c9942830d12b85cd938a844efe0d6.png",
    "status": "installed",
    "purchaseDate": "2025-02-03",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780228843265",
    "title": "Uncrashed : FPV Drone",
    "cover": "/uploads/89fa1c71152d432a517b399936287a05.png",
    "status": "installed",
    "purchaseDate": "2025-03-02",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780228794447",
    "title": "LoveChoice 拣爱",
    "cover": "/uploads/5379949fbf656a4865b10d1362d0ee66.png",
    "status": "installed",
    "purchaseDate": "2025-03-04",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780228736897",
    "title": "Lossless Scaling",
    "cover": "/uploads/914efdb3dc3c8a77afefd8ef4178cb96.png",
    "status": "installed",
    "purchaseDate": "2026-01-10",
    "storeLink": "",
    "playtime": ""
  },
  {
    "id": "game_1780228146595",
    "title": "极限竞速：地平线6 豪华版",
    "cover": "/uploads/36688cc5f3b61341272aea8ec2f25940.png",
    "status": "installed",
    "purchaseDate": "2026-02-21",
    "storeLink": "",
    "playtime": "5.4小时"
  }
];