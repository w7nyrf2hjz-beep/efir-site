/**
 * Simple JSON file-based database
 * - Zero dependencies (no native modules)
 * - Works on all platforms without compilation
 * - SQLite-like API: query(), queryOne(), run()
 */
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "efir.json");
const DATA_DIR = path.join(process.cwd(), "data");

interface DbSchema {
  categories: Record<string, unknown>[];
  dishes: Record<string, unknown>[];
  users: Record<string, unknown>[];
  sms_codes: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  order_items: Record<string, unknown>[];
  payments: Record<string, unknown>[];
  settings: Record<string, unknown>[];
  _autoIncrement: Record<string, number>;
}

const EMPTY_DB: DbSchema = {
  categories: [], dishes: [], users: [], sms_codes: [],
  orders: [], order_items: [], payments: [], settings: [],
  _autoIncrement: {},
};

// Global singleton
const globalDb = globalThis as typeof globalThis & { __efirDb?: DbSchema };

function loadDb(): DbSchema {
  if (globalDb.__efirDb) return globalDb.__efirDb;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    globalDb.__efirDb = JSON.parse(JSON.stringify(EMPTY_DB));
    return globalDb.__efirDb!;
  }
  globalDb.__efirDb = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DbSchema;
  return globalDb.__efirDb!;
}

function saveDb(): void {
  const db = loadDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 0));
}

function nextId(table: string): number {
  const db = loadDb();
  db._autoIncrement[table] = (db._autoIncrement[table] || 0) + 1;
  return db._autoIncrement[table];
}

// ── Tiny SQL parser (supports INSERT, UPDATE, SELECT, DELETE) ─────────────────

type Row = Record<string, unknown>;

function matchesWhere(row: Row, where: string, params: unknown[]): boolean {
  if (!where.trim()) return true;
  let pi = 0;
  const condition = where.replace(/\?/g, () => {
    const v = params[pi++];
    return typeof v === "string" ? `"${v.replace(/"/g, '\\"')}"` : String(v);
  });
  // Very simple condition evaluator
  // Supports: col=val, col!=val, col IS NULL, col IS NOT NULL, AND/OR, LIKE, >, <
  const evalCondition = (cond: string): boolean => {
    cond = cond.trim();
    // OR
    if (cond.includes(" OR ")) {
      return cond.split(" OR ").some(c => evalCondition(c));
    }
    // AND
    if (cond.includes(" AND ")) {
      return cond.split(" AND ").every(c => evalCondition(c));
    }
    // IS NOT NULL
    const isNotNull = cond.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNull) return row[isNotNull[1]] != null;
    // IS NULL
    const isNull = cond.match(/^(\w+)\s+IS\s+NULL$/i);
    if (isNull) return row[isNull[1]] == null;
    // LIKE
    const like = cond.match(/^(\w+)\s+LIKE\s+"(.+)"$/i);
    if (like) {
      const val = String(row[like[1]] ?? "").toLowerCase();
      const pat = like[2].replace(/%/g, ".*").replace(/_/g, ".").toLowerCase();
      return new RegExp(`^${pat}$`).test(val);
    }
    // !=
    const neq = cond.match(/^(\w+)\s*!=\s*"?([^"]*)"?$/);
    if (neq) return String(row[neq[1]]) !== neq[2];
    // >=
    const gte = cond.match(/^(\w+)\s*>=\s*(.+)$/);
    if (gte) return Number(row[gte[1]]) >= Number(gte[2]);
    // <=
    const lte = cond.match(/^(\w+)\s*<=\s*(.+)$/);
    if (lte) return Number(row[lte[1]]) <= Number(lte[2]);
    // >
    const gt = cond.match(/^(\w+)\s*>\s*(.+)$/);
    if (gt) return Number(row[gt[1]]) > Number(gt[2]);
    // <
    const lt = cond.match(/^(\w+)\s*<\s*(.+)$/);
    if (lt) return Number(row[lt[1]]) < Number(lt[2]);
    // = with quoted string
    const eqStr = cond.match(/^(\w+)\s*=\s*"([^"]*)"$/);
    if (eqStr) return String(row[eqStr[1]] ?? "") === eqStr[2];
    // = with number
    const eqNum = cond.match(/^(\w+)\s*=\s*(-?\d+\.?\d*)$/);
    if (eqNum) return Number(row[eqNum[1]]) === Number(eqNum[2]);
    // DATE() comparison
    const dateCmp = cond.match(/^DATE\((\w+)\)\s*=\s*"([^"]+)"$/i);
    if (dateCmp) {
      const v = String(row[dateCmp[1]] ?? "").slice(0, 10);
      return v === dateCmp[2];
    }
    return true;
  };
  return evalCondition(condition);
}

function getTable(name: string): Row[] {
  const db = loadDb();
  const t = name.toLowerCase().trim() as keyof DbSchema;
  return (db[t] as Row[] | undefined) ?? [];
}

function parseSelect(sql: string, params: unknown[]): Row[] {
  // SELECT ... FROM table [LEFT JOIN other ON ...] [WHERE ...] [ORDER BY ...] [LIMIT ...]
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (!fromMatch) return [];
  const tableName = fromMatch[1];
  let rows = getTable(tableName).map(r => ({ ...r }));

  // LEFT JOIN
  const joinMatch = sql.match(/LEFT JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
  if (joinMatch) {
    const [, joinTable, , leftCol, , rightCol] = joinMatch;
    const joinRows = getTable(joinTable);
    rows = rows.map(r => {
      const match = joinRows.find(j => j[rightCol] === r[leftCol]);
      if (match) {
        const prefixed: Row = { ...r };
        Object.keys(match).forEach(k => { if (!(k in prefixed)) prefixed[k] = match[k]; });
        return prefixed;
      }
      return r;
    });
  }

  // WHERE
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/is);
  if (whereMatch) {
    rows = rows.filter(r => matchesWhere(r, whereMatch[1], params));
  }

  // ORDER BY
  const orderMatch = sql.match(/ORDER BY\s+(.+?)(?:\s+LIMIT|$)/i);
  if (orderMatch) {
    const orderStr = orderMatch[1].trim();
    const desc = /DESC$/i.test(orderStr);
    const col = orderStr.replace(/\s+(ASC|DESC)$/i, "").trim().split(",")[0].trim();
    rows.sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av < bv ? -1 : av > bv ? 1 : 0) * (desc ? -1 : 1);
    });
  }

  // LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) rows = rows.slice(0, parseInt(limitMatch[1]));

  // SELECT columns
  const selMatch = sql.match(/^SELECT\s+(.+?)\s+FROM/is);
  const selStr = selMatch?.[1].trim() ?? "*";
  if (selStr === "*") return rows;

  return rows.map(r => {
    const out: Row = {};
    selStr.split(",").forEach(col => {
      const c = col.trim();
      const alias = c.match(/(\w+)\s+as\s+(\w+)/i);
      if (alias) { out[alias[2]] = r[alias[1]]; }
      else if (c === "*") { Object.assign(out, r); }
      else if (c.includes(".")) { const p = c.split("."); out[p[1]] = r[p[1]]; }
      else if (c.match(/COUNT\(\*\)\s+as\s+(\w+)/i)) {
        const m = c.match(/COUNT\(\*\)\s+as\s+(\w+)/i)!;
        out[m[1]] = rows.length;
      }
      else if (c.match(/COALESCE\(SUM\((\w+)\),0\)\s+as\s+(\w+)/i)) {
        const m = c.match(/COALESCE\(SUM\((\w+)\),0\)\s+as\s+(\w+)/i)!;
        out[m[2]] = rows.reduce((s, rr) => s + (Number(rr[m[1]]) || 0), 0);
      }
      else if (c.match(/COUNT\(\*\)\s+as\s+(\w+)/i)) {
        const m = c.match(/COUNT\(\*\)\s+as\s+(\w+)/i)!;
        out[m[1]] = rows.length;
      }
      else { out[c] = r[c]; }
    });
    return out;
  });
}

export function query<T = Row>(sql: string, params: unknown[] = []): T[] {
  return parseSelect(sql, params) as T[];
}

export function queryOne<T = Row>(sql: string, params: unknown[] = []): T | undefined {
  return query<T>(sql, params)[0];
}

export function run(sql: string, params: unknown[] = []): { lastInsertRowid: number } {
  const db = loadDb();
  const s = sql.trim();

  // INSERT OR IGNORE / INSERT OR REPLACE / INSERT
  const insertMatch = s.match(/INSERT\s+(?:OR\s+(IGNORE|REPLACE)\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (insertMatch) {
    const [, conflict, tableName, colsStr] = insertMatch;
    const t = tableName.toLowerCase() as keyof DbSchema;
    const cols = colsStr.split(",").map(c => c.trim());
    let pi = 0;
    const vals = insertMatch[4].split(",").map(v => {
      v = v.trim();
      if (v === "?") return params[pi++];
      if (v === "NULL" || v === "null") return null;
      if (v.match(/^datetime\('now'\)$/i)) return new Date().toISOString().slice(0, 19).replace("T", " ");
      if (v.startsWith("'") || v.startsWith('"')) return v.slice(1, -1);
      return isNaN(Number(v)) ? v : Number(v);
    });
    const row: Row = { id: nextId(t) };
    cols.forEach((c, i) => { row[c] = vals[i]; });

    const table = db[t] as Row[];
    if (conflict === "IGNORE") {
      // Check unique - simple check on phone/slug/key
      const uniqueCols = ["phone", "slug", "key", "order_number"];
      const dup = uniqueCols.some(uc => row[uc] != null && table.some(r => r[uc] === row[uc]));
      if (dup) return { lastInsertRowid: 0 };
    } else if (conflict === "REPLACE") {
      const uniqueCols = ["key", "slug", "phone"];
      for (const uc of uniqueCols) {
        if (row[uc] != null) {
          const idx = table.findIndex(r => r[uc] === row[uc]);
          if (idx >= 0) { table.splice(idx, 1); break; }
        }
      }
    }
    table.push(row);
    saveDb();
    return { lastInsertRowid: row.id as number };
  }

  // UPDATE
  const updateMatch = s.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/is);
  if (updateMatch) {
    const [, tableName, setStr, whereStr] = updateMatch;
    const t = tableName.toLowerCase() as keyof DbSchema;
    const table = db[t] as Row[];
    let pi = 0;
    const setParts = setStr.split(/,(?![^(]*\))/).map(p => {
      const [col, ...rest] = p.trim().split("=");
      let val: unknown = rest.join("=").trim();
      if (val === "?") val = params[pi++];
      else if (String(val).match(/^datetime\('now'\)$/i)) val = new Date().toISOString().slice(0, 19).replace("T", " ");
      else if (String(val) === "NULL") val = null;
      else if (String(val).startsWith("'") || String(val).startsWith('"')) val = String(val).slice(1, -1);
      else if (String(val).match(/^\w+\s*\+\s*\d+$/)) {
        // e.g. attempts=attempts+1 - handled at apply time
      }
      else if (!isNaN(Number(val))) val = Number(val);
      return { col: col.trim(), val };
    });

    const whereParams = params.slice(pi);
    table.forEach(row => {
      if (!whereStr || matchesWhere(row, whereStr, whereParams)) {
        setParts.forEach(({ col, val }) => {
          if (String(val).match(/^\w+\s*\+\s*\d+$/)) {
            const m = String(val).match(/^(\w+)\s*\+\s*(\d+)$/)!;
            row[col] = (Number(row[m[1]]) || 0) + Number(m[2]);
          } else {
            row[col] = val;
          }
        });
      }
    });
    saveDb();
    return { lastInsertRowid: 0 };
  }

  // DELETE
  const delMatch = s.match(/DELETE FROM\s+(\w+)\s+WHERE\s+(.+)/i);
  if (delMatch) {
    const [, tableName, whereStr] = delMatch;
    const t = tableName.toLowerCase() as keyof DbSchema;
    const table = db[t] as Row[];
    const before = table.length;
    (db[t] as Row[]) = table.filter(r => !matchesWhere(r, whereStr, params));
    if ((db[t] as Row[]).length !== before) saveDb();
    return { lastInsertRowid: 0 };
  }

  return { lastInsertRowid: 0 };
}
