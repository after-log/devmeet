import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { onboarded } from './lib/profile-storage';
import SignupPage from './pages/SignupPage';
import DiscoverPage from './pages/DiscoverPage';
import LikesPage from './pages/likes';
import LikeDetailPage from './pages/likes/detail';
import ChatsPage from './pages/chat';
import ChatPage from './pages/chat/detail';
import MyProfilePage from './pages/MyProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<Navigate to={onboarded() ? '/discover' : '/signup'} replace />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="discover" element={<DiscoverPage />} />
      <Route path="likes" element={<LikesPage />} />
      <Route path="likes/:profileId" element={<LikeDetailPage />} />
      <Route path="chat" element={<ChatsPage />} />
      <Route path="chat/:profileId" element={<ChatPage />} />
      <Route path="admin" element={<AdminPage />} />
      <Route path="me" element={<MyProfilePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
export default App;
