import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArticleList from './pages/ArticleList';
import ArticleDetail from './pages/ArticleDetail';
import Timeline from './pages/Timeline';
import Guestbook from './pages/Guestbook';
import GraffitiWall from './pages/GraffitiWall';
import TagPage from './pages/TagPage';
import MessageSend from './pages/MessageSend';
import MessageThread from './pages/MessageThread';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminArticles from './pages/admin/AdminArticles';
import AdminComments from './pages/admin/AdminComments';
import AdminGuestbook from './pages/admin/AdminGuestbook';
import AdminMessages from './pages/admin/AdminMessages';
import AdminWall from './pages/admin/AdminWall';
import { AudioProvider } from './hooks/useGlobalAudio';
import GlobalPlayer from './components/GlobalPlayer';

export default function App() {
  return (
    <AudioProvider>
      <GlobalPlayer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/guestbook" element={<Guestbook />} />
          <Route path="/wall" element={<GraffitiWall />} />
          <Route path="/tags/:tagName" element={<TagPage />} />
          <Route path="/messages" element={<MessageSend />} />
          <Route path="/messages/:threadId" element={<MessageThread />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/articles" element={<AdminArticles />} />
          <Route path="/admin/comments" element={<AdminComments />} />
          <Route path="/admin/guestbook" element={<AdminGuestbook />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/wall" element={<AdminWall />} />
        </Route>
      </Routes>
    </AudioProvider>
  );
}
