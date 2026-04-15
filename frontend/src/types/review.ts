export interface Review {
  id: number;
  nickname: string;
  rating: number;
  content: string;
  created_at: string;
}

export interface ReviewCreatePayload {
  nickname: string;
  password: string;
  rating: number;
  content: string;
}

export interface ReviewDeletePayload {
  password: string;
}
