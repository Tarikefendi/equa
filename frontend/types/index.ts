export interface User {
  id: string;
  email: string;
  username: string;
  is_verified: boolean;
  is_admin?: boolean;
  reputation_score: number;
  created_at: string;
  role?: string;
}

export interface Campaign {
  id: string;
  creator_id: string;
  creator_username?: string;
  title: string;
  description: string;
  target_entity: string;
  target_type: 'company' | 'brand' | 'government';
  category: string;
  status: 'draft' | 'under_review' | 'active' | 'concluded';
  goals?: any;
  evidence?: any;
  created_at: string;
  updated_at: string;
  vote_count?: number;
}

export interface Vote {
  id: string;
  campaign_id: string;
  user_id: string;
  vote_choice: 'support' | 'oppose' | 'neutral';
  created_at: string;
}

export interface Comment {
  id: string;
  campaign_id: string;
  user_id: string;
  username: string;
  content: string;
  parent_id?: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  reputation_score: number;
  reply_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
