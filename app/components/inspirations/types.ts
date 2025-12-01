export interface InspirationComment {
    id: string;
    user_name: string;
    content: string;
    created_at: string;
}

export interface InspirationLike {
    user_name: string;
}

export interface Inspiration {
    id: string;
    title: string;
    category: string;
    notes: string | null;
    photo_url: string;
    created_at: string;
    user_id?: string; // Optional depending on DB schema, helpful for permissions
    inspiration_likes: InspirationLike[];
    inspiration_comments: InspirationComment[];
}

export type SortOption = "recent" | "likes";
