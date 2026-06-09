// app/api/weather/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.QWEATHER_KEY;
  const locationId = "101010100"; // 北京

  // 未配置天气 API 密钥时，返回空数据而非报错
  if (!token) {
    return NextResponse.json({
      code: "200",
      now: {
        temp: "--",
        text: "未配置",
        windDir: "--",
        windScale: "--",
        humidity: "--",
        feelsLike: "--",
      },
      message: "天气服务未配置，请在环境变量中设置 QWEATHER_KEY"
    });
  }

  // 尝试两个可能的 API Host（正式环境 / 免费开发环境）
  const apiHosts = [
    'https://api.qweather.com/v7/weather/now',
    'https://devapi.qweather.com/v7/weather/now'
  ];

  for (const host of apiHosts) {
    try {
      const url = `${host}?location=${locationId}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Encoding': 'gzip',
          'User-Agent': 'SilentFall-Blog-Weather/1.0'
        },
        next: { revalidate: 300 }
      });

      const data = await res.json();

      if (data.code === "200" || res.status === 200) {
        return NextResponse.json(data);
      }

      console.warn(`天气 API ${host} 返回非 200:`, data);

    } catch (err: any) {
      console.error(`天气 API 请求 ${host} 出错:`, err.message);
      continue;
    }
  }

  // 所有 API 均失败时，返回兜底数据而非 500 错误
  return NextResponse.json({
    code: "200",
    now: {
      temp: "--",
      text: "获取失败",
      windDir: "--",
      windScale: "--",
      humidity: "--",
      feelsLike: "--",
    },
    message: "天气服务暂时不可用"
  });
}
