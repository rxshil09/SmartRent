import { RentalsService } from './rentals.service.js';

export const CronService = {
  start() {
    console.log('⏰ Expired reservations release cron service started.');
    
    // Run every 60 seconds to check and release expired reservations
    setInterval(async () => {
      try {
        console.log('⏰ Checking for expired rental reservations...');
        const releasedCount = await RentalsService.releaseExpiredReservations();
        if (releasedCount > 0) {
          console.log(`⏰ Successfully released ${releasedCount} expired orders back to available stock.`);
        }
      } catch (err) {
        console.error('⏰ Error executing reservation release cron job:', err.message);
      }
    }, 60 * 1000);
  }
};
