/**
 * Instagram Graph API 클라이언트
 * Basic Display API / Instagram Graph API를 통해 인사이트 데이터를 수집
 */
export class InstagramClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getUserProfile(): Promise<{
    id: string;
    username: string;
    mediaCount?: number;
  } | null> {
    try {
      const res = await fetch(
        `https://graph.instagram.com/me?fields=id,username,media_count&access_token=${this.accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getRecentMedia(limit = 10): Promise<{
    id: string;
    caption?: string;
    mediaType: string;
    mediaUrl?: string;
    permalink: string;
    timestamp: string;
  }[]> {
    try {
      const res = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${this.accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map((item: any) => ({
        id: item.id,
        caption: item.caption,
        mediaType: item.media_type,
        mediaUrl: item.media_url,
        permalink: item.permalink,
        timestamp: item.timestamp,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Instagram Business API 인사이트 수집
   * (Business/Creator 계정만 가능)
   */
  async getInsights(): Promise<{
    followers?: number;
    impressions?: number;
    reach?: number;
    profileViews?: number;
  }> {
    try {
      const res = await fetch(
        `https://graph.instagram.com/me/insights?metric=impressions,reach,profile_views&period=day&access_token=${this.accessToken}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) return {};

      const data = await res.json();
      const metrics: Record<string, number> = {};

      for (const item of data.data || []) {
        const value = item.values?.[0]?.value;
        if (value !== undefined) {
          metrics[item.name] = value;
        }
      }

      return {
        impressions: metrics.impressions,
        reach: metrics.reach,
        profileViews: metrics.profile_views,
      };
    } catch {
      return {};
    }
  }
}
