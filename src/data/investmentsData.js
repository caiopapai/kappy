// src/data/investmentsData.js

export const ASSET_TYPES = [
  { value: "acoes",      label: "Ações",                  icon: "📈", flag: "BR"  },
  { value: "fii",        label: "FIIs",                   icon: "🏢", flag: "BR"  },
  { value: "tesouro",    label: "Tesouro Direto",         icon: "🏛",  flag: "BR"  },
  { value: "renda_fixa", label: "Renda Fixa",             icon: "📄", flag: "BR"  },
  { value: "bdr",        label: "BDR",                    icon: "🌐", flag: "BR"  },
  { value: "fundos",     label: "Fundos de Investimento", icon: "💼", flag: "BR"  },
  { value: "stocks",     label: "Stocks",                 icon: "🗽", flag: "US"  },
  { value: "reit",       label: "REIT",                   icon: "🏙",  flag: "US"  },
  { value: "etf",        label: "ETF",                    icon: "📦", flag: "ANY" },
  { value: "crypto",     label: "Criptomoedas",           icon: "₿",  flag: "ANY" },
];

export const ASSET_COLOR = {
  acoes:      "#4ade80",
  fii:        "#34d399",
  tesouro:    "#60a5fa",
  renda_fixa: "#93c5fd",
  bdr:        "#a78bfa",
  fundos:     "#c084fc",
  stocks:     "#f59e0b",
  reit:       "#fb923c",
  etf:        "#38bdf8",
  crypto:     "#f472b6",
};

export const DIVIDEND_ASSET_TYPES = [
  "acoes", "fii", "stocks", "reit", "etf", "fundos", "bdr", "renda_fixa", "tesouro",
];

export const EXCHANGES = [
  { value: "B3",       label: "B3 – Bovespa (Brasil)",      currency: "BRL", flag: "🇧🇷" },
  { value: "NYSE",     label: "NYSE – Nova York",           currency: "USD", flag: "🇺🇸" },
  { value: "NASDAQ",   label: "NASDAQ",                     currency: "USD", flag: "🇺🇸" },
  { value: "LSE",      label: "LSE – Londres",              currency: "GBP", flag: "🇬🇧" },
  { value: "EURONEXT", label: "Euronext (Paris/Amsterdam)", currency: "EUR", flag: "🇪🇺" },
  { value: "TSE",      label: "TSE – Tóquio",               currency: "JPY", flag: "🇯🇵" },
  { value: "SSE",      label: "SSE – Xangai",               currency: "CNY", flag: "🇨🇳" },
  { value: "HKEX",     label: "HKEX – Hong Kong",           currency: "HKD", flag: "🇭🇰" },
  { value: "NSE",      label: "NSE – Índia (Mumbai)",       currency: "INR", flag: "🇮🇳" },
  { value: "XETRA",    label: "XETRA – Frankfurt",          currency: "EUR", flag: "🇩🇪" },
];

export const EXCHANGE_STOCKS = {
  B3: [
    { ticker: "PETR4", name: "Petrobras PN" }, { ticker: "VALE3", name: "Vale ON" },
    { ticker: "ITUB4", name: "Itaú Unibanco PN" }, { ticker: "BBDC4", name: "Bradesco PN" },
    { ticker: "WEGE3", name: "WEG ON" }, { ticker: "ABEV3", name: "Ambev ON" },
    { ticker: "B3SA3", name: "B3 ON" }, { ticker: "RENT3", name: "Localiza ON" },
    { ticker: "BBAS3", name: "Banco do Brasil ON" }, { ticker: "PRIO3", name: "PRIO ON" },
    { ticker: "EGIE3", name: "Engie Brasil ON" }, { ticker: "TOTS3", name: "TOTVS ON" },
  ],
  NYSE: [
    { ticker: "AAPL", name: "Apple Inc." }, { ticker: "MSFT", name: "Microsoft Corp." },
    { ticker: "GOOGL", name: "Alphabet Inc." }, { ticker: "AMZN", name: "Amazon.com Inc." },
    { ticker: "NVDA", name: "NVIDIA Corp." }, { ticker: "META", name: "Meta Platforms" },
    { ticker: "TSLA", name: "Tesla Inc." }, { ticker: "JPM", name: "JPMorgan Chase" },
    { ticker: "V", name: "Visa Inc." }, { ticker: "WMT", name: "Walmart Inc." },
  ],
  NASDAQ: [
    { ticker: "AAPL", name: "Apple Inc." }, { ticker: "MSFT", name: "Microsoft Corp." },
    { ticker: "NVDA", name: "NVIDIA Corp." }, { ticker: "AMZN", name: "Amazon.com Inc." },
    { ticker: "GOOGL", name: "Alphabet Inc." }, { ticker: "META", name: "Meta Platforms" },
    { ticker: "TSLA", name: "Tesla Inc." }, { ticker: "NFLX", name: "Netflix Inc." },
    { ticker: "AMD", name: "Advanced Micro Devices" }, { ticker: "ADBE", name: "Adobe Inc." },
  ],
  LSE: [
    { ticker: "SHEL", name: "Shell plc" }, { ticker: "AZN", name: "AstraZeneca plc" },
    { ticker: "HSBA", name: "HSBC Holdings" }, { ticker: "BP", name: "BP plc" },
    { ticker: "RIO", name: "Rio Tinto plc" }, { ticker: "ULVR", name: "Unilever plc" },
  ],
  EURONEXT: [
    { ticker: "LVMH", name: "LVMH Moët Hennessy" }, { ticker: "TTE", name: "TotalEnergies" },
    { ticker: "SAN", name: "Sanofi" }, { ticker: "AIR", name: "Airbus SE" },
    { ticker: "ASML", name: "ASML Holding" },
  ],
  TSE: [
    { ticker: "7203", name: "Toyota Motor" }, { ticker: "6758", name: "Sony Group" },
    { ticker: "9984", name: "SoftBank Group" }, { ticker: "7974", name: "Nintendo" },
  ],
  SSE: [
    { ticker: "600519", name: "Kweichow Moutai" }, { ticker: "601398", name: "ICBC" },
  ],
  HKEX: [
    { ticker: "0700", name: "Tencent Holdings" }, { ticker: "9988", name: "Alibaba Group" },
  ],
  NSE: [
    { ticker: "RELIANCE", name: "Reliance Industries" }, { ticker: "TCS", name: "Tata Consultancy" },
    { ticker: "HDFCBANK", name: "HDFC Bank" }, { ticker: "INFY", name: "Infosys" },
  ],
  XETRA: [
    { ticker: "SAP", name: "SAP SE" }, { ticker: "SIE", name: "Siemens AG" },
    { ticker: "ALV", name: "Allianz SE" }, { ticker: "BMW", name: "BMW AG" },
    { ticker: "VOW3", name: "Volkswagen" },
  ],
};