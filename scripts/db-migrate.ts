import { ensureDatabase } from '../src/lib/db';

ensureDatabase();

console.log('Drizzle migrations applied.');
