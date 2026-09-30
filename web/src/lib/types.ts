export interface User {
  id: number;
  email: string;
  display_name: string;
  bio: string | null;
  title: string | null;
  company: string | null;
  phone: string | null;
  photo_url: string | null;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface WhoAmI {
  user: User;
  roles: string[];
  permissions: Record<string, string>;
  council_id: number | null;
  council_slug: string | null;
  council_role: string | null;
  unread_notifications: number;
}

export interface PostAuthor {
  id: number;
  display_name: string;
  title: string | null;
  company: string | null;
  photo_url: string | null;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Post {
  id: number;
  thread_id: number;
  author: PostAuthor;
  body: string;
  position: number;
  edited_at: string | null;
  created_at: string;
}

export interface ThreadSummary {
  id: number;
  title: string;
  author: PostAuthor;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  tags: Tag[];
  last_activity_at: string;
  created_at: string;
}

export interface ThreadDetail {
  id: number;
  council_id: number;
  title: string;
  author: PostAuthor;
  pinned: boolean;
  locked: boolean;
  reply_count: number;
  tags: Tag[];
  posts: Post[];
  is_subscribed: boolean;
  is_muted: boolean;
  last_activity_at: string;
  created_at: string;
}

export interface ThreadsResponse {
  threads: ThreadSummary[];
  total: number;
  page: number;
  per_page: number;
}

export interface Council {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  member_count: number;
  created_at: string;
}

export const COUNCIL_ROLES = [
  { value: "chair", label: "Chair" },
  { value: "vice_chair_membership", label: "Vice Chair, Membership" },
  { value: "vice_chair_programming", label: "Vice Chair, Programming" },
  { value: "firm_member", label: "Firm Member" },
  { value: "industry_member", label: "Industry Member" },
] as const;

export const COUNCIL_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  COUNCIL_ROLES.map((r) => [r.value, r.label])
);

export interface CouncilMember {
  id: number;
  user_id: number;
  display_name: string;
  email: string;
  title: string | null;
  company: string | null;
  photo_url: string | null;
  role: string;
  joined_at: string;
}

export interface Document {
  id: number;
  council_id: number;
  uploaded_by: number;
  uploader_name: string;
  filename: string;
  display_name: string;
  description: string | null;
  mime_type: string;
  file_size: number;
  category: string;
  created_at: string;
}

export interface Meeting {
  id: number;
  council_id: number;
  title: string;
  description: string | null;
  meeting_date: string;
  location: string | null;
  meeting_link: string | null;
  created_by: number;
  creator_name: string;
  created_at: string;
}

export interface ConversationSummary {
  id: number;
  title: string | null;
  is_group: boolean;
  other_members: PostAuthor[];
  last_message: MessageRead | null;
  unread: boolean;
  last_message_at: string | null;
  created_at: string;
}

export interface ConversationDetail {
  id: number;
  title: string | null;
  is_group: boolean;
  members: PostAuthor[];
  messages: MessageRead[];
  created_at: string;
}

export interface MessageRead {
  id: number;
  conversation_id: number;
  author: PostAuthor;
  body: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unread_count: number;
}

export interface NotificationPreferences {
  forum_frequency: string;
  dm_frequency: string;
  mention_frequency: string;
}
