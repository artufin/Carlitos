// Recommender interface. NOT IMPLEMENTED (MVP): machine learning ranking.
// The MVP implementation only matches news to the user's topics. The
// `Interaction` table (impressions and clicks) is already being populated so a
// future implementation has data to learn from.

export interface RecommenderUser {
  id: string;
  topicIds: string[];
}

export interface RankableNews {
  id: string;
  topicId: string;
  publishedAt: Date;
}

export interface Recommender {
  /** Returns the subset of `news` to show to `user`, in display order. */
  rank<T extends RankableNews>(user: RecommenderUser, news: T[]): Promise<T[]>;
}

/**
 * Topic-matching recommender: keeps news whose topic the user follows,
 * newest first. A user with no topics sees everything (onboarding case).
 */
export class TopicRecommender implements Recommender {
  async rank<T extends RankableNews>(user: RecommenderUser, news: T[]): Promise<T[]> {
    const follows = new Set(user.topicIds);
    const filtered = follows.size === 0 ? news : news.filter((n) => follows.has(n.topicId));
    return [...filtered].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }
}

export const recommender: Recommender = new TopicRecommender();
