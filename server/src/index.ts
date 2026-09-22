/**
 * Local development server entry point.
 * On Vercel, api/index.ts is used instead (serverless).
 */
import app from './app.js';
import { dispatchCelebrationBlessings } from './services/celebrationService.js';

const PORT = process.env.PORT || 5000;

// Automated Daily Celebration Dispatcher — only runs in persistent (non-serverless) mode
const AUTO_DISPATCH_HOUR = 7;
let lastAutoRunDay = -1;

setInterval(async () => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentHour = now.getHours();

  if (currentHour >= AUTO_DISPATCH_HOUR && lastAutoRunDay !== currentDay) {
    lastAutoRunDay = currentDay;
    console.log(`[Celebration Engine] Running daily automated Birthday & Anniversary check for ${now.toDateString()}...`);
    try {
      const result = await dispatchCelebrationBlessings({});
      console.log(`[Celebration Engine] Dispatched blessings to ${result.dispatchedCount} celebrants.`);
    } catch (err: any) {
      console.error('[Celebration Engine] Error in automated celebration dispatch:', err.message);
    }
  }
}, 60 * 1000); // Check every minute

app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  CACI Church Management Backend Running!   `);
  console.log(`  Port: http://localhost:${PORT}             `);
  console.log(`  Database: TiDB Cloud (caci_church_db)     `);
  console.log(`=============================================`);
});
