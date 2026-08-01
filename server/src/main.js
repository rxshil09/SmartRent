import { createApp } from './app.module.js';
import { config } from './config/configuration.js';
import { CronService } from './rentals/cron.service.js';

createApp()
  .then(app => {
    app.listen(config.port, () => {
      console.log(`API running on http://localhost:${config.port}`);
      CronService.start();
    });
  })
  .catch(err => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
