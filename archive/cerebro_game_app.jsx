import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Banknote,
  Factory,
  Store,
  Pickaxe,
  AlertTriangle,
  ShieldAlert,
  Leaf,
  Landmark,
  Brain,
  Plus,
  Minus,
  RotateCcw,
  Coins,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const FIELD_META = {
  MARKET: { name: "Рынок", icon: Store, color: "from-cyan-500/20 to-sky-500/10" },
  RAW: { name: "Добыча сырья", icon: Pickaxe, color: "from-amber-500/20 to-orange-500/10" },
  PRODUCTION: { name: "Производство", icon: Factory, color: "from-violet-500/20 to-fuchsia-500/10" },
  SALES: { name: "Сбыт", icon: Banknote, color: "from-emerald-500/20 to-teal-500/10" },
  BANK: { name: "Банк", icon: Landmark, color: "from-yellow-500/20 to-lime-500/10" },
  CRISIS: { name: "Кризис", icon: AlertTriangle, color: "from-red-500/20 to-orange-500/10" },
  ECOLOGY: { name: "Экология", icon: Leaf, color: "from-green-500/20 to-emerald-500/10" },
  ANTITRUST: { name: "Антимонополия", icon: ShieldAlert, color: "from-indigo-500/20 to-blue-500/10" },
};

const fields = [
  "MARKET",
  "RAW",
  "PRODUCTION",
  "SALES",
  "BANK",
  "CRISIS",
  "ECOLOGY",
  "ANTITRUST",
];

const companies = [
  { id: "raw-1", name: "Рудник Альфа", category: "raw", price: 20, capacity: 10 },
  { id: "raw-2", name: "Карьер Бета", category: "raw", price: 25, capacity: 12 },
  { id: "raw-3", name: "Шахта Гамма", category: "raw", price: 30, capacity: 14 },
  { id: "raw-4", name: "Рудник Дельта", category: "raw", price: 35, capacity: 16 },
  { id: "raw-5", name: "Карьер Эпсилон", category: "raw", price: 40, capacity: 18 },
  { id: "raw-6", name: "Шахта Зета", category: "raw", price: 45, capacity: 20 },

  { id: "prod-air-1", name: "Авиапром 1", category: "production", sector: "air", price: 30, capacity: 10 },
  { id: "prod-air-2", name: "Авиапром 2", category: "production", sector: "air", price: 40, capacity: 14 },
  { id: "prod-auto-1", name: "Машинострой 1", category: "production", sector: "auto", price: 30, capacity: 10 },
  { id: "prod-auto-2", name: "Машинострой 2", category: "production", sector: "auto", price: 40, capacity: 14 },
  { id: "prod-tech-1", name: "Электроника 1", category: "production", sector: "tech", price: 35, capacity: 12 },
  { id: "prod-tech-2", name: "Электроника 2", category: "production", sector: "tech", price: 45, capacity: 16 },

  { id: "sales-air", name: "Сбыт самолётов", category: "sales", sector: "air", price: 25, capacity: 14 },
  { id: "sales-auto", name: "Сбыт автомобилей", category: "sales", sector: "auto", price: 25, capacity: 14 },
  { id: "sales-tech", name: "Сбыт компьютеров", category: "sales", sector: "tech", price: 25, capacity: 14 },
  { id: "super-1", name: "Супермаркет 1", category: "sales", sector: "any", price: 40, capacity: 18 },
  { id: "super-2", name: "Супермаркет 2", category: "sales", sector: "any", price: 50, capacity: 22 },
];

const productMap = {
  air: { label: "Самолёты", value: 3 },
  auto: { label: "Автомобили", value: 2 },
  tech: { label: "Компьютеры", value: 2 },
};

const initialPlayer = (id, name, color, soloBot = false) => ({
  id,
  name,
  color,
  cash: 100,
  raw: 0,
  products: { air: 0, auto: 0, tech: 0 },
  companyIds: [],
  loanPrincipal: 0,
  loanDue: 0,
  loanAge: 0,
  currentField: null,
  soloBot,
});

function classNames(...list) {
  return list.filter(Boolean).join(" ");
}

function getCompany(id) {
  return companies.find((c) => c.id === id);
}

function ownedCompanies(player, predicate) {
  return player.companyIds.map(getCompany).filter(Boolean).filter(predicate || (() => true));
}

function hasMonopoly(player) {
  const own = ownedCompanies(player);
  return own.some((c) => c.category === "raw") && own.some((c) => c.category === "production") && own.some((c) => c.category === "sales");
}

function calcCapital(player) {
  const companiesValue = player.companyIds.map((id) => getCompany(id)?.price || 0).reduce((a, b) => a + b, 0);
  const rawValue = player.raw * 0.25;
  const goodsValue = Object.entries(player.products).reduce((sum, [sector, qty]) => sum + qty * productMap[sector].value * 0.75, 0);
  return Math.round((player.cash + companiesValue + rawValue + goodsValue - player.loanDue) * 10) / 10;
}

function nextLoanDue(principal, age, currentDue) {
  if (!principal) return { principal: 0, loanDue: 0, loanAge: 0 };
  const rate = age < 10 ? 0.1 : age < 20 ? 0.2 : 0.3;
  return {
    principal,
    loanAge: age + 1,
    loanDue: Math.round((currentDue * (1 + rate)) * 10) / 10,
  };
}

function getAvailableCompanyIds(players) {
  const taken = new Set(players.flatMap((p) => p.companyIds));
  return companies.filter((c) => !taken.has(c.id));
}

function App() {
  const [mode, setMode] = useState("solo");
  const [players, setPlayers] = useState([
    initialPlayer("p1", "Игрок 1", "cyan"),
    initialPlayer("p2", "Игрок 2", "violet", true),
  ]);
  const [turn, setTurn] = useState(0);
  const [selectedField, setSelectedField] = useState("MARKET");
  const [log, setLog] = useState(["Игра готова. Выберите режим и начните первый ход."]);
  const [marketCompanyId, setMarketCompanyId] = useState("none");
  const [bankAmount, setBankAmount] = useState(10);

  const currentPlayer = players[turn];
  const availableCompanies = useMemo(() => getAvailableCompanyIds(players), [players]);
  const crisisBlocked = players.some((p) => p.currentField === "CRISIS");
  const ecoBlocked = players.some((p) => p.currentField === "ECOLOGY");

  function resetGame(nextMode = mode) {
    const basePlayers =
      nextMode === "solo"
        ? [initialPlayer("p1", "Игрок", "cyan"), initialPlayer("p2", "AI", "violet", true)]
        : [initialPlayer("p1", "Игрок 1", "cyan"), initialPlayer("p2", "Игрок 2", "violet")];

    setPlayers(basePlayers);
    setTurn(0);
    setSelectedField("MARKET");
    setLog([`Новая игра: ${nextMode === "solo" ? "1 игрок против AI" : "2 игрока по очереди"}.`]);
    setMarketCompanyId("none");
  }

  function pushLog(text) {
    setLog((prev) => [text, ...prev].slice(0, 16));
  }

  function updatePlayer(playerId, updater) {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? updater(p) : p)));
  }

  function performMarketAction(action) {
    if (marketCompanyId === "none") return;
    const company = getCompany(marketCompanyId);
    if (!company) return;

    const isOwned = currentPlayer.companyIds.includes(company.id);
    if (action === "buy") {
      if (!availableCompanies.some((c) => c.id === company.id)) return;
      if (currentPlayer.cash < company.price) return;
      updatePlayer(currentPlayer.id, (p) => ({ ...p, cash: p.cash - company.price, companyIds: [...p.companyIds, company.id] }));
      pushLog(`${currentPlayer.name} купил компанию «${company.name}» за ${company.price} C.`);
    } else if (action === "sell" && isOwned) {
      updatePlayer(currentPlayer.id, (p) => ({ ...p, cash: p.cash + company.price, companyIds: p.companyIds.filter((id) => id !== company.id) }));
      pushLog(`${currentPlayer.name} продал компанию «${company.name}» за ${company.price} C.`);
    }
  }

  function performRawAction(companyId) {
    if (!companyId) return;
    const company = getCompany(companyId);
    if (!company || company.category !== "raw") return;
    updatePlayer(currentPlayer.id, (p) => ({ ...p, raw: p.raw + company.capacity }));
    pushLog(`${currentPlayer.name} добыл ${company.capacity} ед. сырья на «${company.name}».`);
  }

  function performProductionAction(companyId) {
    if (ecoBlocked) return;
    const company = getCompany(companyId);
    if (!company || company.category !== "production") return;
    const qty = Math.min(company.capacity, currentPlayer.raw);
    if (qty <= 0) return;
    updatePlayer(currentPlayer.id, (p) => ({
      ...p,
      raw: p.raw - qty,
      products: { ...p.products, [company.sector]: p.products[company.sector] + qty },
    }));
    pushLog(`${currentPlayer.name} произвел ${qty} ед. товара: ${productMap[company.sector].label.toLowerCase()}.`);
  }

  function performSalesAction(companyId) {
    if (crisisBlocked) return;
    const company = getCompany(companyId);
    if (!company || company.category !== "sales") return;

    const sector = company.sector;
    const qty = sector === "any"
      ? Math.min(company.capacity, currentPlayer.products.air + currentPlayer.products.auto + currentPlayer.products.tech)
      : Math.min(company.capacity, currentPlayer.products[sector]);

    if (qty <= 0) return;

    if (sector === "any") {
      let remain = qty;
      const nextProducts = { ...currentPlayer.products };
      ["air", "auto", "tech"].forEach((s) => {
        const sold = Math.min(remain, nextProducts[s]);
        nextProducts[s] -= sold;
        remain -= sold;
      });
      const revenue =
        (currentPlayer.products.air - nextProducts.air) * productMap.air.value +
        (currentPlayer.products.auto - nextProducts.auto) * productMap.auto.value +
        (currentPlayer.products.tech - nextProducts.tech) * productMap.tech.value;

      updatePlayer(currentPlayer.id, (p) => ({ ...p, products: nextProducts, cash: p.cash + revenue }));
      pushLog(`${currentPlayer.name} реализовал товары через супермаркет и получил ${revenue} C.`);
    } else {
      const revenue = qty * productMap[sector].value;
      updatePlayer(currentPlayer.id, (p) => ({
        ...p,
        products: { ...p.products, [sector]: p.products[sector] - qty },
        cash: p.cash + revenue,
      }));
      pushLog(`${currentPlayer.name} продал ${qty} ед. товара и получил ${revenue} C.`);
    }
  }

  function performBankAction(action) {
    if (action === "borrow") {
      if (currentPlayer.loanPrincipal > 0) return;
      const amount = Math.max(10, Math.min(50, bankAmount));
      updatePlayer(currentPlayer.id, (p) => ({
        ...p,
        cash: p.cash + amount,
        loanPrincipal: amount,
        loanDue: amount,
        loanAge: 0,
      }));
      pushLog(`${currentPlayer.name} взял кредит ${amount} C.`);
    } else if (action === "payInterest") {
      if (currentPlayer.loanPrincipal <= 0) return;
      const accrued = Math.max(0, Math.round((currentPlayer.loanDue - currentPlayer.loanPrincipal) * 10) / 10);
      if (accrued <= 0 || currentPlayer.cash < accrued) return;
      updatePlayer(currentPlayer.id, (p) => ({
        ...p,
        cash: p.cash - accrued,
        loanDue: p.loanPrincipal,
        loanAge: 0,
      }));
      pushLog(`${currentPlayer.name} погасил только проценты по кредиту: ${accrued} C.`);
    } else if (action === "repayAll") {
      if (currentPlayer.loanDue <= 0 || currentPlayer.cash < currentPlayer.loanDue) return;
      updatePlayer(currentPlayer.id, (p) => ({
        ...p,
        cash: Math.round((p.cash - p.loanDue) * 10) / 10,
        loanPrincipal: 0,
        loanDue: 0,
        loanAge: 0,
      }));
      pushLog(`${currentPlayer.name} полностью вернул кредит.`);
    }
  }

  function performAntitrust() {
    setPlayers((prev) =>
      prev.map((p) => {
        if (hasMonopoly(p)) {
          const tax = Math.floor(p.cash * 0.5);
          pushLog(`${p.name} признан монополистом и платит налог ${tax} C.`);
          return { ...p, cash: p.cash - tax };
        }
        return p;
      })
    );
  }

  function applyFieldEffects(field) {
    updatePlayer(currentPlayer.id, (p) => ({ ...p, currentField: field }));
    if (field === "ANTITRUST") performAntitrust();
    if (field === "CRISIS") pushLog(`${currentPlayer.name} активировал кризис: сбыт заблокирован, пока кто-то стоит на этом поле.`);
    if (field === "ECOLOGY") pushLog(`${currentPlayer.name} активировал экологическую блокировку производства.`);
  }

  function endTurn() {
    const current = players[turn];
    const aged = nextLoanDue(current.loanPrincipal, current.loanAge, current.loanDue);

    if (current.loanPrincipal > 0) {
      setPlayers((prev) =>
        prev.map((p, idx) => {
          if (idx !== turn) return p;
          const next = { ...p, ...aged };
          return next.loanAge >= 31 ? { ...next, cash: 0, raw: 0, products: { air: 0, auto: 0, tech: 0 }, companyIds: [] } : next;
        })
      );

      if (aged.loanAge >= 31) {
        pushLog(`${current.name} обанкротился из-за просроченного кредита.`);
      }
    }

    const nextTurn = (turn + 1) % players.length;
    setTurn(nextTurn);
    setSelectedField("MARKET");
  }

  function runSimpleAI() {
    const bot = players[turn];
    if (!bot?.soloBot) return;

    const rawOwned = ownedCompanies(bot, (c) => c.category === "raw");
    const prodOwned = ownedCompanies(bot, (c) => c.category === "production");
    const salesOwned = ownedCompanies(bot, (c) => c.category === "sales");
    const freeRaw = availableCompanies.filter((c) => c.category === "raw" && c.price <= bot.cash);
    const freeProd = availableCompanies.filter((c) => c.category === "production" && c.price <= bot.cash);
    const freeSales = availableCompanies.filter((c) => c.category === "sales" && c.price <= bot.cash);

    if (freeRaw.length) {
      setSelectedField("MARKET");
      setMarketCompanyId(freeRaw[0].id);
      applyFieldEffects("MARKET");
      updatePlayer(bot.id, (p) => ({ ...p, cash: p.cash - freeRaw[0].price, companyIds: [...p.companyIds, freeRaw[0].id], currentField: "MARKET" }));
      pushLog(`AI купил «${freeRaw[0].name}».`);
      endTurn();
      return;
    }
    if (rawOwned.length && bot.raw < 10) {
      applyFieldEffects("RAW");
      updatePlayer(bot.id, (p) => ({ ...p, raw: p.raw + rawOwned[0].capacity, currentField: "RAW" }));
      pushLog(`AI добыл сырье.`);
      endTurn();
      return;
    }
    if (freeProd.length) {
      applyFieldEffects("MARKET");
      updatePlayer(bot.id, (p) => ({ ...p, cash: p.cash - freeProd[0].price, companyIds: [...p.companyIds, freeProd[0].id], currentField: "MARKET" }));
      pushLog(`AI купил «${freeProd[0].name}».`);
      endTurn();
      return;
    }
    if (prodOwned.length && bot.raw > 0 && !ecoBlocked) {
      const company = prodOwned[0];
      const qty = Math.min(company.capacity, bot.raw);
      applyFieldEffects("PRODUCTION");
      updatePlayer(bot.id, (p) => ({ ...p, raw: p.raw - qty, products: { ...p.products, [company.sector]: p.products[company.sector] + qty }, currentField: "PRODUCTION" }));
      pushLog(`AI произвел товары.`);
      endTurn();
      return;
    }
    if (freeSales.length) {
      applyFieldEffects("MARKET");
      updatePlayer(bot.id, (p) => ({ ...p, cash: p.cash - freeSales[0].price, companyIds: [...p.companyIds, freeSales[0].id], currentField: "MARKET" }));
      pushLog(`AI купил «${freeSales[0].name}».`);
      endTurn();
      return;
    }
    if (salesOwned.length && !crisisBlocked) {
      const company = salesOwned[0];
      const sector = company.sector === "any" ? "air" : company.sector;
      const qty = Math.min(company.capacity, bot.products[sector]);
      if (qty > 0) {
        applyFieldEffects("SALES");
        updatePlayer(bot.id, (p) => ({ ...p, products: { ...p.products, [sector]: p.products[sector] - qty }, cash: p.cash + qty * productMap[sector].value, currentField: "SALES" }));
        pushLog(`AI продал товар.`);
        endTurn();
        return;
      }
    }
    if (bot.loanPrincipal === 0 && bot.cash < 20) {
      applyFieldEffects("BANK");
      updatePlayer(bot.id, (p) => ({ ...p, cash: p.cash + 20, loanPrincipal: 20, loanDue: 20, loanAge: 0, currentField: "BANK" }));
      pushLog(`AI взял кредит.`);
      endTurn();
      return;
    }

    applyFieldEffects("BANK");
    pushLog(`AI сделал нейтральный ход на поле «Банк».`);
    endTurn();
  }

  React.useEffect(() => {
    if (mode === "solo" && currentPlayer?.soloBot) {
      const timer = setTimeout(() => runSimpleAI(), 500);
      return () => clearTimeout(timer);
    }
  }, [turn, mode]);

  const rawOwned = ownedCompanies(currentPlayer, (c) => c.category === "raw");
  const prodOwned = ownedCompanies(currentPlayer, (c) => c.category === "production");
  const salesOwned = ownedCompanies(currentPlayer, (c) => c.category === "sales");
  const renderPlayerCard = (player, idx) => (
    <Card className={classNames(
      "border-white/10 bg-white/5 backdrop-blur-xl",
      idx === turn && "ring-1 ring-cyan-400/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{player.name}</CardTitle>
          <Badge className="bg-white/10 text-white">Капитал: {calcCapital(player)} C</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Stat icon={Coins} label="Наличные" value={`${player.cash} C`} />
        <Stat icon={Pickaxe} label="Сырьё" value={player.raw} />
        <Stat icon={Factory} label="Самолёты" value={player.products.air} />
        <Stat icon={Factory} label="Автомобили" value={player.products.auto} />
        <Stat icon={Factory} label="Компьютеры" value={player.products.tech} />
        <Stat icon={Landmark} label="Долг" value={player.loanDue ? `${player.loanDue} C` : "нет"} />
        <div>
          <div className="mb-2 flex items-center justify-between text-slate-300">
            <span>Срок кредита</span>
            <span>{player.loanAge}/30</span>
          </div>
          <Progress value={(player.loanAge / 30) * 100} className="h-2 bg-white/10" />
        </div>
        <Separator className="bg-white/10" />
        <div>
          <div className="mb-2 text-slate-300">Компании</div>
          <div className="flex flex-wrap gap-2">
            {player.companyIds.length ? player.companyIds.map((id) => (
              <Badge key={id} className="bg-white/10 text-slate-100">{getCompany(id)?.name}</Badge>
            )) : <Muted>Пока нет активов.</Muted>}
          </div>
        </div>
        <div className="pt-1 text-xs text-slate-400">
          Поле: {player.currentField ? FIELD_META[player.currentField].name : "ещё не ходил"}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(180deg,_#07111f,_#030712_45%,_#020617)] text-slate-100">
      <div className="w-full px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cyan-200 backdrop-blur">
              <Brain className="h-4 w-4" />
              Cerebro — цифровая настольная экономика
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Онлайн-игра по правилам «Церебро»</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              Покупайте компании, добывайте сырьё, производите товары, продавайте, блокируйте соперника кризисом и экологией,
              берите кредиты и управляйте капиталом.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="secondary" className="border border-white/10 bg-white/10 text-white hover:bg-white/20" onClick={() => { setMode("solo"); resetGame("solo"); }}>
              1 игрок
            </Button>
            <Button variant="secondary" className="border border-white/10 bg-white/10 text-white hover:bg-white/20" onClick={() => { setMode("duo"); resetGame("duo"); }}>
              2 игрока
            </Button>
            <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => resetGame(mode)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Новая партия
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
            <div>
              {players[0] && renderPlayerCard(players[0], 0)}
            </div>
            <Card className="overflow-hidden border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl md:text-2xl">Панель хода</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">Сейчас ходит: <span className="font-medium text-white">{currentPlayer.name}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="border-cyan-400/30 bg-cyan-400/15 text-cyan-200">Режим: {mode === "solo" ? "соло" : "2 игрока"}</Badge>
                    {crisisBlocked && <Badge className="bg-red-500/15 text-red-200">Сбыт заблокирован</Badge>}
                    {ecoBlocked && <Badge className="bg-green-500/15 text-green-200">Производство заблокировано</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid w-full grid-cols-2 gap-3">
                  {fields.map((field) => {
                    const meta = FIELD_META[field];
                    const Icon = meta.icon;
                    const forbidden = currentPlayer.currentField === field;
                    return (
                      <motion.button
                        key={field}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !forbidden && setSelectedField(field)}
                        className={classNames(
                          "rounded-2xl border p-3 text-left transition",
                          selectedField === field ? "border-cyan-300 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                          forbidden && "cursor-not-allowed opacity-40"
                        )}
                      >
                        <div className={classNames("mb-3 inline-flex rounded-xl bg-gradient-to-br p-2", meta.color)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium">{meta.name}</div>
                        {forbidden && <div className="mt-1 text-xs text-slate-400">Нельзя дважды подряд</div>}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <Tabs value={selectedField} onValueChange={setSelectedField}>
                    <TabsList className="hidden" />

                    <TabsContent value="MARKET" className="mt-0 space-y-4">
                      <FieldTitle field="MARKET" text="Купите или продайте одну компанию по фиксированной цене." />
                      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                        <Select value={marketCompanyId} onValueChange={setMarketCompanyId}>
                          <SelectTrigger className="border-white/10 bg-white/5"><SelectValue placeholder="Выберите компанию" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Выбрать компанию</SelectItem>
                            {[...availableCompanies, ...ownedCompanies(currentPlayer)].map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name} · {c.price} C · лимит {c.capacity}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={() => { applyFieldEffects("MARKET"); performMarketAction("buy"); }}>
                          <Plus className="mr-2 h-4 w-4" /> Купить
                        </Button>
                        <Button variant="secondary" className="border-white/10 bg-white/10 text-white hover:bg-white/20" onClick={() => { applyFieldEffects("MARKET"); performMarketAction("sell"); }}>
                          <Minus className="mr-2 h-4 w-4" /> Продать
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="RAW" className="mt-0 space-y-4">
                      <FieldTitle field="RAW" text="За ход можно добыть сырьё только на одной своей добывающей компании." />
                      <div className="flex flex-wrap gap-3">
                        {rawOwned.map((c) => (
                          <Button key={c.id} className="bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => { applyFieldEffects("RAW"); performRawAction(c.id); }}>
                            {c.name} +{c.capacity}
                          </Button>
                        ))}
                        {!rawOwned.length && <Muted>Нет добывающих компаний.</Muted>}
                      </div>
                    </TabsContent>

                    <TabsContent value="PRODUCTION" className="mt-0 space-y-4">
                      <FieldTitle field="PRODUCTION" text="Обменяйте сырьё на товары в пределах мощности одной выбранной компании." />
                      {ecoBlocked ? <Blocked text="Поле «Производство» заблокировано из-за экологической экспертизы." /> : (
                        <div className="flex flex-wrap gap-3">
                          {prodOwned.map((c) => (
                            <Button key={c.id} className="bg-violet-400 text-slate-950 hover:bg-violet-300" onClick={() => { applyFieldEffects("PRODUCTION"); performProductionAction(c.id); }}>
                              {c.name} → {productMap[c.sector].label}
                            </Button>
                          ))}
                          {!prodOwned.length && <Muted>Нет производственных компаний.</Muted>}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="SALES" className="mt-0 space-y-4">
                      <FieldTitle field="SALES" text="Продайте товары через одну торговую компанию или супермаркет." />
                      {crisisBlocked ? <Blocked text="Поле «Сбыт» заблокировано из-за кризиса перепроизводства." /> : (
                        <div className="flex flex-wrap gap-3">
                          {salesOwned.map((c) => (
                            <Button key={c.id} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300" onClick={() => { applyFieldEffects("SALES"); performSalesAction(c.id); }}>
                              {c.name}
                            </Button>
                          ))}
                          {!salesOwned.length && <Muted>Нет торговых компаний.</Muted>}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="BANK" className="mt-0 space-y-4">
                      <FieldTitle field="BANK" text="Возьмите кредит 10–50 C или погасите проценты / весь долг." />
                      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                        <Input type="number" value={bankAmount} min={10} max={50} onChange={(e) => setBankAmount(Number(e.target.value))} className="border-white/10 bg-white/5" />
                        <div className="flex flex-wrap gap-3">
                          <Button className="bg-yellow-400 text-slate-950 hover:bg-yellow-300" onClick={() => { applyFieldEffects("BANK"); performBankAction("borrow"); }}>Взять кредит</Button>
                          <Button variant="secondary" className="border-white/10 bg-white/10 text-white hover:bg-white/20" onClick={() => performBankAction("payInterest")}>Погасить проценты</Button>
                          <Button variant="secondary" className="border-white/10 bg-white/10 text-white hover:bg-white/20" onClick={() => performBankAction("repayAll")}>Погасить всё</Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="CRISIS" className="mt-0 space-y-4">
                      <FieldTitle field="CRISIS" text="Блокирует сбыт, пока хотя бы один игрок стоит на этом поле." />
                      <Button className="bg-red-400 text-slate-950 hover:bg-red-300" onClick={() => applyFieldEffects("CRISIS")}>Активировать кризис</Button>
                    </TabsContent>

                    <TabsContent value="ECOLOGY" className="mt-0 space-y-4">
                      <FieldTitle field="ECOLOGY" text="Блокирует производство товаров для всех игроков." />
                      <Button className="bg-green-400 text-slate-950 hover:bg-green-300" onClick={() => applyFieldEffects("ECOLOGY")}>Активировать экологию</Button>
                    </TabsContent>

                    <TabsContent value="ANTITRUST" className="mt-0 space-y-4">
                      <FieldTitle field="ANTITRUST" text="Все монополисты платят 50% от наличных средств." />
                      <Button className="bg-indigo-400 text-slate-950 hover:bg-indigo-300" onClick={() => applyFieldEffects("ANTITRUST")}>Запустить проверку</Button>
                    </TabsContent>

                  </Tabs>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400" onClick={endTurn} disabled={mode === "solo" && currentPlayer.soloBot}>
                    Завершить ход
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div>
              {players[1] ? renderPlayerCard(players[1], 1) : (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardContent className="py-6 text-sm text-slate-400">Второй игрок недоступен в режиме соло.</CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl">Игровой журнал</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {log.map((entry, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-sm text-slate-200">
                      {entry}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl">Условия победы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-1 font-medium text-white">Игра на время</div>
                  <div>Побеждает игрок с наибольшим капиталом: наличные + компании + сырьё (25%) + товары (75%) − долги.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-1 font-medium text-white">Игра Миллионер</div>
                  <div>Можно использовать как домашнее правило: победа при достижении целевой суммы наличных.</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-1 font-medium text-white">Игра Магнат</div>
                  <div>Домашнее правило: победа при покупке мощной производственной компании и супермаркета.</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl">Ключевые правила</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <Rule icon={Lock} text="Нельзя оставаться на одном поле два хода подряд." />
                <Rule icon={Pickaxe} text="За ход добыча возможна только на одной добывающей компании." />
                <Rule icon={Factory} text="За ход производство возможно только на одной производственной компании." />
                <Rule icon={Store} text="За ход сбыт возможен только через один магазин или супермаркет." />
                <Rule icon={Unlock} text="Кредит можно вернуть в любой свой ход, не обязательно посещая банк." />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldTitle({ field, text }) {
  const meta = FIELD_META[field];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className={classNames("rounded-2xl bg-gradient-to-br p-2", meta.color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-medium text-white">{meta.name}</div>
        <div className="mt-1 text-sm text-slate-400">{text}</div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
      <div className="flex items-center gap-2 text-slate-300"><Icon className="h-4 w-4" /> {label}</div>
      <div className="font-medium text-white">{value}</div>
    </div>
  );
}

function Rule({ icon: Icon, text }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-cyan-300" />
      <div>{text}</div>
    </div>
  );
}

function Blocked({ text }) {
  return <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{text}</div>;
}

function Muted({ children }) {
  return <div className="text-sm text-slate-500">{children}</div>;
}

export default App;
