export interface CreateCommentParams {
  tokenAddress: string;
  walletAddress: string;
  content: string;
}

export interface CommentUser {
  id: string;
  walletAddress: string;
}

export interface CommentItem {
  id: string;
  content: string;
  tokenAddress: string;
  userId: string;
  user: CommentUser;
  createdAt: string | Date;
}

export interface CreateCommentResult {
  id: string;
  content: string;
  tokenAddress: string;
  userId: string;
  user: CommentUser;
  createdAt: Date;
  status: 'processing' | 'persisted';
}


