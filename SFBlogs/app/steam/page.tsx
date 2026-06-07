import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import SteamBoard from './SteamBoard';

export const metadata = {
  title: "Steam 游戏库 | SilentFall の 博客",
  description: "我的 Steam 游戏收藏",
};

export default function SteamPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <SteamBoard />
        </div>
      </PageTransition>
    </div>
  );
}
