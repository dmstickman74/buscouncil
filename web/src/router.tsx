import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { ForumPage } from "@/pages/Forum";
import { ThreadDetailPage } from "@/pages/ThreadDetail";
import { NewThreadPage } from "@/pages/NewThread";
import { DocumentsPage } from "@/pages/Documents";
import { MeetingsPage } from "@/pages/Meetings";
import { MembersPage } from "@/pages/Members";
import { MemberProfilePage } from "@/pages/MemberProfile";
import { MyProfilePage } from "@/pages/MyProfile";
import { ConversationsPage } from "@/pages/Conversations";
import { ConversationDetailPage } from "@/pages/ConversationDetail";
import { NewConversationPage } from "@/pages/NewConversation";
import { NotificationsPage } from "@/pages/Notifications";
import { NotificationPreferencesPage } from "@/pages/NotificationPreferences";
import { SearchPage } from "@/pages/Search";
import { AdminPage } from "@/pages/admin/Admin";
import { AdminCouncilDetailPage } from "@/pages/admin/AdminCouncilDetail";
import { AdminUsersPage } from "@/pages/admin/AdminUsers";
import { AdminActivityPage } from "@/pages/admin/AdminActivity";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "forum", element: <ForumPage /> },
      { path: "forum/new", element: <NewThreadPage /> },
      { path: "forum/:threadId", element: <ThreadDetailPage /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "meetings", element: <MeetingsPage /> },
      { path: "members", element: <MembersPage /> },
      { path: "members/:memberId", element: <MemberProfilePage /> },
      { path: "profile", element: <MyProfilePage /> },
      { path: "messages", element: <ConversationsPage /> },
      { path: "messages/new", element: <NewConversationPage /> },
      { path: "messages/:conversationId", element: <ConversationDetailPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "notifications/preferences", element: <NotificationPreferencesPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "admin/councils/:councilId", element: <AdminCouncilDetailPage /> },
      { path: "admin/users", element: <AdminUsersPage /> },
      { path: "admin/activity", element: <AdminActivityPage /> },
    ],
  },
]);
