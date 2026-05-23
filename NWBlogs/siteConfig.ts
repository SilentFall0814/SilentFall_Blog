// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "NoWin の 博客",
  faviconUrl: "/uploads/88242e4974bfacd40bf2e024e2bb0a2e.jpg",
  authorName: "NoWin",
  bio: "一个14岁的社恐、宅男、一个有着非常非常多的奇怪想法的人类",

  navTitle: "NoWin",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "博客",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "/uploads/88242e4974bfacd40bf2e024e2bb0a2e.jpg",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
// 修改这里：变成图片数组
  bgImages: ["https://img.cdn1.vip/i/6a0478597141c_1778677849.webp", "https://img.cdn1.vip/i/6a04787516bba_1778677877.webp", "https://img.cdn1.vip/i/6a0478634dafc_1778677859.webp", "https://img.cdn1.vip/i/6a047870d497d_1778677872.webp"],

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",

  // 5. 首页照片墙预览图
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
  cloudMusicIds: ["421423806", "436514312", "1974630461", "2068401809", "85571", "247821"],
  social: {
    github: "https://github.com/wznb666-0814",
    gitee: "https://gitee.com/NoWin0814",
    google: "liangjunboljb@gmail.com",
    email: "liangjunboljb@163.com",
    qq: "3552931982",
    wechat: "失败总是贯穿人生",
  },
  counts: {
    photos: 128,
  },
  chatterTitle: "文章",
  chatterDescription: "代码、学术、提瓦特与泰拉大陆的碎片记录",

  useLocalPicBed: true, // 🌟 是否使用本地存储图片

  // 👇 【新增】：全局背景弹幕配置
  danmakuList: ["Jay", "NoWin", "ZmjjKK", "我喜欢你！", "在干嘛呢？", "有笨蛋嘛？", "前方高能反应！", "BUG 修复进度 99%", "今天背单词了吗？", "睡大觉中", "到底在干嘛？"],
  buildDate: "2026-05-13T21:00:00", // 建站日期
  footerBadges: [{"name": "Next.js 15", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"}, {"name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"}, {"name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"}],
  icpConfig: {
    name: "额...正在加急备案",
  },
};