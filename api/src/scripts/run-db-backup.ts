// Runs the database backup once, outside the Friday schedule.
// Local:      npx tsx src/scripts/run-db-backup.ts
// Production: docker compose exec api node dist/scripts/run-db-backup.js
import "dotenv/config";
import { runDatabaseBackup } from "../services/db-backup.service";

runDatabaseBackup()
  .then(({ fileName, sizeBytes }) => console.log(`Backup ${fileName} uploaded (${sizeBytes} bytes)`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
