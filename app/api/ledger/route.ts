import { env } from "cloudflare:workers";

type Row = Record<string, unknown>;
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

async function snapshot() {
  const db = env.DB;
  const existing = await db.prepare("SELECT * FROM ledger_settings WHERE id = 1").first<Row>();
  if (!existing) await db.prepare("INSERT INTO ledger_settings (id, initial_investment, dividend_ratio, profit_mapping_ratio, updated_at) VALUES (1, 650000, 90, 100, ?)").bind(now()).run();
  const settings = await db.prepare("SELECT * FROM ledger_settings WHERE id = 1").first<Row>();
  const [subscriptions, transactions, expenses] = await Promise.all([
    db.prepare("SELECT id, name, units, value, status, note, created_at AS createdAt FROM subscriptions ORDER BY created_at DESC").all<Row>(),
    db.prepare("SELECT id, transaction_date AS date, seller, buyer, units, price, created_at AS createdAt FROM share_transactions ORDER BY transaction_date DESC, created_at DESC").all<Row>(),
    db.prepare("SELECT id, expense_date AS date, type, category, amount, note, created_at AS createdAt FROM expenses ORDER BY expense_date DESC, created_at DESC").all<Row>(),
  ]);
  return { settings, subscriptions: subscriptions.results, transactions: transactions.results, expenses: expenses.results };
}

function text(v: unknown) { return typeof v === "string" ? v.trim() : ""; }
function number(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

async function holdingUnits(name: string) {
  const db = env.DB;
  const subscribed = await db.prepare("SELECT COALESCE(SUM(units), 0) AS units FROM subscriptions WHERE name = ? AND status = '已确认持有'").bind(name).first<{ units: number }>();
  const sold = await db.prepare("SELECT COALESCE(SUM(units), 0) AS units FROM share_transactions WHERE seller = ?").bind(name).first<{ units: number }>();
  const bought = await db.prepare("SELECT COALESCE(SUM(units), 0) AS units FROM share_transactions WHERE buyer = ?").bind(name).first<{ units: number }>();
  return number(subscribed?.units) - number(sold?.units) + number(bought?.units);
}

export async function GET() { try { return Response.json(await snapshot()); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "无法读取共享账本" }, { status: 500 }); } }

export async function POST(request: Request) {
  try {
    const { action, payload = {} } = await request.json() as { action?: string; payload?: Row };
    const db = env.DB;
    if (action === "settings:update") {
      const initialInvestment = number(payload.initialInvestment), dividendRatio = number(payload.dividendRatio), profitMappingRatio = number(payload.profitMappingRatio);
      if (initialInvestment < 0 || dividendRatio < 0 || dividendRatio > 100 || profitMappingRatio < 0) throw new Error("设置数值不合法");
      await db.prepare("UPDATE ledger_settings SET initial_investment = ?, dividend_ratio = ?, profit_mapping_ratio = ?, updated_at = ? WHERE id = 1").bind(initialInvestment, dividendRatio, profitMappingRatio, now()).run();
    } else if (action === "subscription:add") {
      const name = text(payload.name), units = number(payload.units), value = number(payload.value), note = text(payload.note);
      if (!name || !Number.isInteger(units) || units < 1 || units > 100 || value < 0) throw new Error("请填写有效的认购信息");
      const used = await db.prepare("SELECT COALESCE(SUM(units), 0) AS units FROM subscriptions").first<{ units: number }>();
      if (number(used?.units) + units > 100) throw new Error("认购数量超过可出售的 1% 股份池");
      await db.prepare("INSERT INTO subscriptions (id, name, units, value, status, note, created_at) VALUES (?, ?, ?, ?, '意向认购', ?, ?)").bind(id(), name, units, value, note, now()).run();
    } else if (action === "subscription:confirm") {
      await db.prepare("UPDATE subscriptions SET status = '已确认持有' WHERE id = ? AND status = '意向认购'").bind(text(payload.id)).run();
    } else if (action === "subscription:delete") {
      await db.prepare("DELETE FROM subscriptions WHERE id = ?").bind(text(payload.id)).run();
    } else if (action === "transaction:add") {
      const seller = text(payload.seller), buyer = text(payload.buyer), units = number(payload.units), price = number(payload.price), date = text(payload.date) || now().slice(0, 10);
      if (!seller || !buyer || seller === buyer || !Number.isInteger(units) || units < 1 || price < 0) throw new Error("请填写有效的交易信息");
      if (await holdingUnits(seller) < units) throw new Error("转让方的可用股份不足");
      await db.prepare("INSERT INTO share_transactions (id, transaction_date, seller, buyer, units, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id(), date, seller, buyer, units, price, now()).run();
    } else if (action === "transaction:delete") {
      await db.prepare("DELETE FROM share_transactions WHERE id = ?").bind(text(payload.id)).run();
    } else if (action === "expense:add") {
      const type = text(payload.type), category = text(payload.category), amount = number(payload.amount), note = text(payload.note), date = text(payload.date) || now().slice(0, 10);
      if ((type !== "收入" && type !== "支出") || !category || amount <= 0) throw new Error("请填写有效的收支信息");
      await db.prepare("INSERT INTO expenses (id, expense_date, type, category, amount, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id(), date, type, category, amount, note, now()).run();
    } else if (action === "expense:delete") {
      await db.prepare("DELETE FROM expenses WHERE id = ?").bind(text(payload.id)).run();
    } else throw new Error("不支持的操作");
    return Response.json(await snapshot());
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "保存失败" }, { status: 400 }); }
}
