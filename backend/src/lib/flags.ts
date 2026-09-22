const COUNTRY_ALIASES: Record<string, string> = {
  "england": "england",
  "scotland": "scotland",
  "wales": "wales",
  "northern ireland": "northern-ireland",
  "northern-ireland": "northern-ireland",
  "usa": "united-states",
  "united states": "united-states",
  "united states of america": "united-states",
  "south korea": "south-korea",
  "korea republic": "south-korea",
  "korea": "south-korea",
  "north macedonia": "north-macedonia",
  "czech republic": "czech-republic",
  "czechia": "czech-republic",
  "dr congo": "dr-congo",
  "congo dr": "dr-congo",
  "congo": "republic-of-the-congo",
  "ivory coast": "cote-d-ivoire",
  "cote d'ivoire": "cote-d-ivoire",
  "cote divoire": "cote-d-ivoire",
  "bosnia and herzegovina": "bosnia-and-herzegovina",
  "bosnia-herzegovina": "bosnia-and-herzegovina",
  "bosnia": "bosnia-and-herzegovina",
  "cape verde": "cape-verde",
  "curacao": "curacao",
  "uae": "united-arab-emirates",
  "united arab emirates": "united-arab-emirates",
  "saudi arabia": "saudi-arabia",
  "south africa": "south-africa",
  "costa rica": "costa-rica",
  "costa-rica": "costa-rica",
  "costarica": "costa-rica",
  "rica": "costa-rica",
  "puerto rico": "puerto-rico",
  "new zealand": "new-zealand",
  "hong kong": "hong-kong",
  "international": "world",
  "world": "world",
  "europe": "europe",
};

export function normalizeCountryName(name?: string | null): string {
  if (!name) return "International";
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (lower === "rica" || lower === "costarica" || lower === "costa-rica" || lower === "costa rica") {
    return "Costa Rica";
  }
  if (lower === "czech republic" || lower === "czechia" || lower === "republic") {
    return "Czech Republic";
  }
  if (lower === "salvador" || lower === "el salvador") {
    return "El Salvador";
  }
  if (lower === "arabia" || lower === "saudi arabia") {
    return "Saudi Arabia";
  }
  if (lower === "states" || lower === "united states" || lower === "usa") {
    return "USA";
  }
  return clean;
}

export function slugifyCountry(country: string): string {
  if (!country) return "world";
  const normalized = normalizeCountryName(country);
  const clean = normalized.toLowerCase().trim();
  if (COUNTRY_ALIASES[clean]) {
    return COUNTRY_ALIASES[clean];
  }
  return clean
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCountryFlagUrl(countryName?: string | null): string {
  if (!countryName || countryName.trim() === "" || countryName.toLowerCase() === "international") {
    return "/flags/world.png";
  }

  const slug = slugifyCountry(countryName);
  return `/flags/${slug}.png`;
}
