const CATEGORIES = {
  uk: {
    clothes: "Одяг",
    furniture: "Меблі",
    tech: "Техніка",
    tableware: "Посуд",
    accessories: "Аксесуари",
  },
  en: {
    clothes: "Clothes",
    furniture: "Furniture",
    tech: "Tech",
    tableware: "Tableware",
    accessories: "Accessories",
  },
};

const DECADES = {
  uk: {
    "50s": "50-ті",
    "60s": "60-ті",
    "70s": "70-ті",
    "80s": "80-ті",
    "90s": "90-ті",
  },
  en: {
    "50s": "50s",
    "60s": "60s",
    "70s": "70s",
    "80s": "80s",
    "90s": "90s",
  },
};

const CONDITIONS = {
  uk: {
    mint: "Як новий",
    good: "Добрий стан",
    fair: "Задовільний",
  },
  en: {
    mint: "Mint",
    good: "Good",
    fair: "Fair",
  },
};

export function categoryLabel(value, lang) {
  const key = lang === "uk" ? "uk" : "en";
  return CATEGORIES[key][value] ?? value;
}

export function decadeLabel(value, lang) {
  const key = lang === "uk" ? "uk" : "en";
  return DECADES[key][value] ?? value;
}

export function conditionLabel(value, lang) {
  const key = lang === "uk" ? "uk" : "en";
  return CONDITIONS[key][value] ?? value;
}

export function lotTagLine(product, lang) {
  if (!product) return "";
  return `${decadeLabel(product.decade, lang)} · ${conditionLabel(product.condition, lang)}`;
}
