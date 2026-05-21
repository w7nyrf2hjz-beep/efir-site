import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");

console.log("═".repeat(50));
console.log("  🍽️  ЭФИР — Установка и настройка");
console.log("═".repeat(50));

// 1. Create data dir
const dataDir = join(root, "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log("✅ Папка data/ создана");
}

// 2. Install deps
console.log("\n📦 Установка зависимостей...");
try {
  execSync("npm install", { cwd: root, stdio: "inherit" });
} catch {
  console.error("❌ Ошибка установки. Убедитесь что Node.js установлен.");
  process.exit(1);
}

// 3. Seed DB
console.log("\n🌱 Создание базы данных...");
try {
  execSync("node scripts/seed.mjs", { cwd: root, stdio: "inherit" });
} catch (err) {
  console.error("❌ Ошибка создания БД:", err.message);
  process.exit(1);
}

// 4. Build
console.log("\n🔨 Сборка приложения (займёт 1-2 минуты)...");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
} catch (err) {
  console.error("❌ Ошибка сборки:", err.message);
  process.exit(1);
}

console.log("\n" + "═".repeat(50));
console.log("  ✅ Установка завершена!");
console.log("═".repeat(50));
console.log("  Запустите: npm start");
console.log("  Откройте:  http://localhost:3000");
console.log("  Админ:     http://localhost:3000/admin");
console.log("  Телефон:   +77001234567");
console.log("═".repeat(50) + "\n");
