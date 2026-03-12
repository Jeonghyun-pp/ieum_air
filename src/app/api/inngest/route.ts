import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { scrapeOwnListing } from '@/inngest/functions/scrape-own-listing';
import { buildCompSet } from '@/inngest/functions/build-comp-set';
import { scrapeCompDetails } from '@/inngest/functions/scrape-comp-details';
import { analyzeMarketIntel } from '@/inngest/functions/analyze-market-intel';
import { runDiagnosis } from '@/inngest/functions/run-diagnosis';
import { generateStrategyFn } from '@/inngest/functions/generate-strategy';
import { monitorCompetitors } from '@/inngest/functions/monitor-competitors';
import { generateReport } from '@/inngest/functions/generate-report';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    scrapeOwnListing,
    buildCompSet,
    scrapeCompDetails,
    analyzeMarketIntel,
    runDiagnosis,
    generateStrategyFn,
    monitorCompetitors,
    generateReport,
  ],
});
