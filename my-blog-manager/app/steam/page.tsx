import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import SteamBoard from './SteamBoard';

export const metadata = {
  title: "Steam 游戏管理 | SilentFall の 博客",
  description: "Steam 游戏库后台管理",
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
