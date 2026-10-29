import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from './stores/app';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import TodayPage from './pages/TodayPage';
import PersonPage from './pages/PersonPage';
import MatchPage from './pages/MatchPage';
import LikesPage from './pages/likes';
import LikeDetailPage from './pages/likes/detail';
import ChatsPage from './pages/chat';
import ChatPage from './pages/chat/detail';
import MePage from './pages/MePage';
import ValuesPage from './pages/ValuesPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

/** 프로필을 만든 회원 또는 둘러보기 중일 때만 들어갈 수 있는 화면 */
const Member = ({ children }: { children: ReactNode }) => {
  const { user, demo } = useApp();
  if (demo) return children;
  if (!user) return <Navigate to="/" replace />;
  if (!user.profile) return <Navigate to="/onboarding" replace />;
  return children;
};

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<WelcomePage />} />
      <Route path="auth/:mode" element={<AuthPage />} />
      <Route path="onboarding" element={<OnboardingPage />} />
      <Route
        path="today"
        element={
          <Member>
            <TodayPage />
          </Member>
        }
      />
      <Route
        path="people/:id"
        element={
          <Member>
            <PersonPage />
          </Member>
        }
      />
      <Route
        path="match/:id"
        element={
          <Member>
            <MatchPage />
          </Member>
        }
      />
      <Route
        path="likes"
        element={
          <Member>
            <LikesPage />
          </Member>
        }
      />
      <Route
        path="likes/:profileId"
        element={
          <Member>
            <LikeDetailPage />
          </Member>
        }
      />
      <Route
        path="chat"
        element={
          <Member>
            <ChatsPage />
          </Member>
        }
      />
      <Route
        path="chat/:profileId"
        element={
          <Member>
            <ChatPage />
          </Member>
        }
      />
      <Route
        path="me"
        element={
          <Member>
            <MePage />
          </Member>
        }
      />
      <Route
        path="me/values"
        element={
          <Member>
            <ValuesPage />
          </Member>
        }
      />
      <Route path="admin" element={<AdminPage />} />
      {/* 예전 주소 호환 */}
      <Route path="discover" element={<Navigate to="/today" replace />} />
      <Route path="signup" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);
export default App;
