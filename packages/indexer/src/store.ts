import { DatabaseSync } from 'node:sqlite';
import { interactions, trustScore, type HonourEvent } from '@honour/contracts/domain';

export class Store {
  db: DatabaseSync;
  constructor(file: string, identity: string, start: number, maxMb = 256) {
    this.db = new DatabaseSync(file);
    this.db.exec(`PRAGMA journal_mode=DELETE; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events (
        hash TEXT NOT NULL, logIndex INTEGER NOT NULL, transactionIndex INTEGER NOT NULL,
        block INTEGER NOT NULL, timestamp INTEGER NOT NULL, type TEXT NOT NULL,
        "from" TEXT NOT NULL, "to" TEXT NOT NULL, offerId TEXT NOT NULL, amount TEXT NOT NULL,
        PRIMARY KEY (hash, logIndex));
      CREATE INDEX IF NOT EXISTS event_from ON events("from");
      CREATE INDEX IF NOT EXISTS event_to ON events("to");
      CREATE INDEX IF NOT EXISTS event_offer ON events(type, offerId);`);
    const pages = Math.floor(maxMb * 1024 * 1024 / 4096);
    this.db.exec(`PRAGMA max_page_count=${pages}`);
    const previous = this.get('identity');
    if (previous && previous !== identity) throw new Error('Database belongs to another deployment; choose a new DB_PATH.');
    this.set('identity', identity);
    if (!this.get('cursor')) this.set('cursor', String(start - 1));
  }
  get(key: string) { return (this.db.prepare('SELECT value FROM metadata WHERE key=?').get(key) as { value: string } | undefined)?.value; }
  set(key: string, value: string) { this.db.prepare('INSERT OR REPLACE INTO metadata VALUES (?,?)').run(key, value); }
  get cursor() { return Number(this.get('cursor')); }
  save(events: HonourEvent[], block: number) {
    const insert = this.db.prepare('INSERT OR IGNORE INTO events VALUES (?,?,?,?,?,?,?,?,?,?)');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const e of events) insert.run(e.hash, e.logIndex, e.transactionIndex, e.block, e.timestamp, e.type, e.from.toLowerCase(), e.to.toLowerCase(), e.offerId, e.amount);
      this.set('cursor', String(block));
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  rebuild(start: number) {
    this.db.exec('BEGIN IMMEDIATE');
    try { this.db.exec('DELETE FROM events'); this.set('cursor', String(start - 1)); this.db.exec('COMMIT'); }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    this.db.exec('VACUUM');
  }
  history(who: string, page = 0) {
    return this.db.prepare('SELECT * FROM events WHERE "from"=? OR "to"=? ORDER BY block DESC, transactionIndex DESC, logIndex DESC LIMIT 30 OFFSET ?')
      .all(who, who, page * 30) as HonourEvent[];
  }
  all(who: string) { return this.db.prepare('SELECT * FROM events WHERE "from"=? OR "to"=?').all(who, who) as HonourEvent[]; }
  pending(who: string) {
    return this.db.prepare(`SELECT e.* FROM events e WHERE (e."from"=? OR e."to"=?) AND e.type IN ('Proposed','Forgiven')
      AND NOT EXISTS (SELECT 1 FROM events done WHERE done.offerId=e.offerId AND done."from"=e."from" AND done."to"=e."to"
        AND done.type=CASE e.type WHEN 'Proposed' THEN 'Honoured' ELSE 'Accepted' END)
      ORDER BY e.block DESC, e.logIndex DESC LIMIT 100`).all(who, who) as HonourEvent[];
  }
  score(subject: string, viewer: string) { return trustScore(interactions(this.all(subject), subject), interactions(this.all(viewer), viewer), viewer, subject); }
  close() { this.db.close(); }
}
