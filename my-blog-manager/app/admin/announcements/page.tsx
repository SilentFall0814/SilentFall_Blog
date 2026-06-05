import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import AnnouncementsBoard from './AnnouncementsBoard';

export const metadata = {
  title: "公告管理 | NoWin の 博客",
  description: "博客公告管理",
};

export default function AnnouncementsPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <AnnouncementsBoard />
        </div>
      </PageTransition>
    </div>
  );
}
