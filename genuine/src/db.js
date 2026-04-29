// Records successful sign attempts. Active only when DB_PATH is set;
// otherwise recordAttempt is a no-op so dev/test runs need no sqlite.

let recordAttemptImpl = () => {};
let listBoardsImpl = () => [];
let findAttemptsByBoardImpl = () => [];

const parseList = (s) => s.split(',').map(Number);

if (process.env.DB_PATH) {
  const {DatabaseSync} = await import('node:sqlite');
  const db = new DatabaseSync(process.env.DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id INTEGER PRIMARY KEY,
      tiles TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY,
      board_id INTEGER NOT NULL REFERENCES boards(id),
      moves TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_board_id_idx ON attempts(board_id);
  `);
  const insertBoard = db.prepare('INSERT OR IGNORE INTO boards (tiles) VALUES (?)');
  const selectBoard = db.prepare('SELECT id FROM boards WHERE tiles = ?');
  const insertAttempt = db.prepare(
    'INSERT INTO attempts (board_id, moves, created_at) VALUES (?, ?, ?)'
  );
  const selectAllBoards = db.prepare(`
    SELECT b.id, b.tiles, COUNT(a.id) AS attempt_count
    FROM boards b
    LEFT JOIN attempts a ON a.board_id = b.id
    GROUP BY b.id
    ORDER BY b.id
  `);
  const selectAttemptsByBoard = db.prepare(
    'SELECT id, moves, created_at FROM attempts WHERE board_id = ? ORDER BY created_at'
  );

  recordAttemptImpl = (tiles, moves) => {
    const tilesKey = tiles.join(',');
    insertBoard.run(tilesKey);
    const {id} = selectBoard.get(tilesKey);
    insertAttempt.run(id, moves.join(','), Date.now());
  };
  listBoardsImpl = () => selectAllBoards.all().map((r) => ({
    id: r.id,
    tiles: parseList(r.tiles),
    attempt_count: r.attempt_count,
  }));
  findAttemptsByBoardImpl = (boardId) => selectAttemptsByBoard.all(boardId).map((r) => ({
    id: r.id,
    moves: parseList(r.moves),
    created_at: r.created_at,
  }));
  console.log(`[genuine] sqlite log at ${process.env.DB_PATH}`);
}

export const recordAttempt = (tiles, moves) => recordAttemptImpl(tiles, moves);
export const listBoards = () => listBoardsImpl();
export const findAttemptsByBoard = (boardId) => findAttemptsByBoardImpl(boardId);
