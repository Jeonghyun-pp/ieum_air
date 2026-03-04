/**
 * Google Analytics 4 Data API 클라이언트
 * GA4 속성에서 트래픽/이벤트 데이터를 수집
 */
export class GA4Client {
  private accessToken: string;
  private propertyId: string;

  constructor(accessToken: string, propertyId: string) {
    this.accessToken = accessToken;
    this.propertyId = propertyId;
  }

  /**
   * GA4 Data API runReport 호출
   */
  private async runReport(body: Record<string, any>): Promise<any> {
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      throw new Error(`GA4 API error: ${res.status}`);
    }

    return await res.json();
  }

  /**
   * 최근 30일 일별 세션 수 가져오기
   */
  async getDailySessions(): Promise<{ date: string; sessions: number }[]> {
    try {
      const data = await this.runReport({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      });

      return (data.rows || []).map((row: any) => ({
        date: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0].value) || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 트래픽 소스별 세션
   */
  async getTrafficSources(): Promise<{ source: string; sessions: number }[]> {
    try {
      const data = await this.runReport({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      });

      return (data.rows || []).map((row: any) => ({
        source: row.dimensionValues[0].value || '(direct)',
        sessions: parseInt(row.metricValues[0].value) || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 국가별 사용자 분포
   */
  async getUsersByCountry(): Promise<{ country: string; users: number }[]> {
    try {
      const data = await this.runReport({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      });

      return (data.rows || []).map((row: any) => ({
        country: row.dimensionValues[0].value || 'Unknown',
        users: parseInt(row.metricValues[0].value) || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * 핵심 지표 요약
   */
  async getSummary(): Promise<{
    totalUsers: number;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
  }> {
    try {
      const data = await this.runReport({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
        ],
      });

      const row = data.rows?.[0];
      if (!row) return { totalUsers: 0, sessions: 0, pageViews: 0, avgSessionDuration: 0 };

      return {
        totalUsers: parseInt(row.metricValues[0].value) || 0,
        sessions: parseInt(row.metricValues[1].value) || 0,
        pageViews: parseInt(row.metricValues[2].value) || 0,
        avgSessionDuration: parseFloat(row.metricValues[3].value) || 0,
      };
    } catch {
      return { totalUsers: 0, sessions: 0, pageViews: 0, avgSessionDuration: 0 };
    }
  }
}
