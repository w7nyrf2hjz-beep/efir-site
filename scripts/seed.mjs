// Seed script - writes JSON database directly, zero dependencies
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const DB_PATH = join(DATA_DIR, "efir.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Load or create DB
let db = existsSync(DB_PATH)
  ? JSON.parse(readFileSync(DB_PATH, "utf-8"))
  : { categories:[], dishes:[], users:[], sms_codes:[], orders:[], order_items:[], payments:[], settings:[], _autoIncrement:{} };

const save = () => writeFileSync(DB_PATH, JSON.stringify(db, null, 0));
const nextId = (t) => { db._autoIncrement[t] = (db._autoIncrement[t]||0)+1; return db._autoIncrement[t]; };

// Categories
const cats = [
  { name:"Горячие блюда", name_kz:"Ыстық тағамдар", slug:"hot-dishes", sort_order:1 },
  { name:"Супы",           name_kz:"Сорпалар",        slug:"soups",      sort_order:2 },
  { name:"Салаты",          name_kz:"Салаттар",        slug:"salads",     sort_order:3 },
  { name:"Выпечка",         name_kz:"Нан өнімдері",    slug:"bakery",     sort_order:4 },
  { name:"Напитки",         name_kz:"Сусындар",        slug:"drinks",     sort_order:5 },
  { name:"Десерты",         name_kz:"Тәттілер",        slug:"desserts",   sort_order:6 },
];
for (const c of cats) {
  if (!db.categories.find(x => x.slug === c.slug)) {
    db.categories.push({ id: nextId("categories"), ...c, is_active:1, created_at: new Date().toISOString() });
  }
}
console.log("Categories:", db.categories.length);

const getCatId = (slug) => db.categories.find(c => c.slug === slug)?.id;

// Dishes
const dishes = [
  ["hot-dishes","Бешбармак","Бешбармақ","Традиционное казахское блюдо из мяса с тестом",2800,"450г",680,1,0],
  ["hot-dishes","Куырдак","Қуырдақ","Жареные субпродукты с луком и специями",1900,"300г",520,1,0],
  ["hot-dishes","Манты с мясом","Еттi манты","Паровые пельмени с говядиной и луком",1500,"350г",450,1,0],
  ["hot-dishes","Плов по-казахски","Қазақша палау","Рис с бараниной и восточными специями",2200,"400г",620,1,0],
  ["hot-dishes","Шашлык из говядины","Сиыр еті шашлығы","Маринованная говядина на углях",2500,"300г",480,0,0],
  ["hot-dishes","Котлета по-домашнему","Үй котлеті","Сочная котлета из фарша с гарниром",1200,"280г",420,0,0],
  ["hot-dishes","Казы с картошкой","Қазы картошкамен","Конская колбаса с картофелем",2100,"350г",590,0,1],
  ["hot-dishes","Жаркое по-казахски","Қазақша жаркое","Тушёная говядина с картофелем в горшочке",1800,"400г",510,0,0],
  ["soups","Сорпа с говядиной","Сиыр еті сорпасы","Наваристый бульон с говядиной и зеленью",900,"400мл",220,1,0],
  ["soups","Лагман","Лағман","Густой суп-лапша с говядиной и овощами",1100,"450мл",380,1,0],
  ["soups","Шурпа","Шорпа","Традиционный суп из баранины с овощами",1000,"400мл",290,0,0],
  ["soups","Борщ домашний","Үй борщы","Наваристый борщ с говядиной и сметаной",850,"400мл",260,0,0],
  ["salads","Оливье","Оливье салаты","Классический салат с колбасой и майонезом",700,"250г",320,1,0],
  ["salads","Салат по-казахски","Қазақша салат","Свежие овощи с национальной заправкой",650,"200г",180,0,1],
  ["salads","Цезарь с курицей","Цезарь тауық етімен","Романо, куриная грудка, соус Цезарь",950,"280г",340,0,0],
  ["bakery","Самса с мясом","Еттi самса","Слоёная выпечка с говядиной и луком",250,"120г",310,1,0],
  ["bakery","Баурсаки","Бауырсақ","Традиционные казахские жареные пончики",400,"200г",480,1,0],
  ["bakery","Лепёшка тандырная","Тандыр нан","Свежая лепёшка из тандыра",300,"200г",380,0,0],
  ["bakery","Пирожок с картошкой","Картошкалы пирожок","Мягкий пирожок с картофелем",180,"90г",240,0,0],
  ["bakery","Чебурек с мясом","Еттi чебурек","Жареный чебурек с говяжьим фаршем",320,"160г",420,0,0],
  ["drinks","Кумыс","Қымыз","Традиционный напиток из кобыльего молока",350,"300мл",90,1,0],
  ["drinks","Шубат","Шұбат","Напиток из верблюжьего молока",400,"300мл",110,0,0],
  ["drinks","Чай по-казахски","Қазақша шай","Крепкий чай с молоком",200,"300мл",60,1,0],
  ["drinks","Компот домашний","Үй компоты","Компот из сухофруктов",200,"300мл",80,0,0],
  ["drinks","Вода Bonaqua","Bonaqua суы","Питьевая вода без газа",150,"500мл",0,0,0],
  ["desserts","Чак-чак","Шақ-шақ","Казахское лакомство из теста с мёдом",450,"150г",520,1,0],
  ["desserts","Медовик","Бал торты","Торт-медовик с нежным кремом",500,"150г",480,0,1],
  ["desserts","Жент","Жент","Казахская сладость из пшена с маслом",350,"120г",440,0,0],
];

for (let i=0; i<dishes.length; i++) {
  const [slug,name,nameKz,desc,price,weight,cal,popular,isNew] = dishes[i];
  if (db.dishes.find(d => d.name===name)) continue;
  db.dishes.push({
    id: nextId("dishes"), category_id: getCatId(slug),
    name, name_kz: nameKz, description: desc,
    price, weight, calories: cal,
    is_available:1, is_popular:popular, is_new:isNew, sort_order:i,
    created_at: new Date().toISOString()
  });
}
console.log("Dishes:", db.dishes.length);

// Admin
const adminPhone = "+77001234567";
const existing = db.users.find(u => u.phone === adminPhone);
if (!existing) {
  db.users.push({ id: nextId("users"), phone: adminPhone, name:"Администратор ЭФИР", role:"admin", is_active:1, created_at: new Date().toISOString() });
} else {
  existing.role = "admin";
}

// Settings
const settingsList = [
  { key:"delivery_fee", value:"500" },
  { key:"free_delivery_from", value:"3000" },
  { key:"min_order", value:"1000" },
];
for (const s of settingsList) {
  const ex = db.settings.find(x => x.key===s.key);
  if (!ex) db.settings.push({ ...s, id: nextId("settings") });
}

save();

console.log("");
console.log("=".repeat(40));
console.log("Database created: data/efir.json");
console.log("Admin phone: +77001234567");
console.log("=".repeat(40));
