// src/constants/geoData.ts

export interface CurrencyOption {
  value: string; // ISO 4217 code e.g. "USD"
  label: string; // e.g. "USD – US Dollar ($)"
  symbol: string; // e.g. "$"
  name: string; // e.g. "US Dollar"
}

export interface CountryOption {
  value: string; // ISO 3166-1 alpha-2 e.g. "US"
  label: string; // e.g. "United States"
}

export const CURRENCIES: CurrencyOption[] = [
  { value: "USD", symbol: "$", name: "US Dollar", label: "USD – US Dollar ($)" },
  { value: "EUR", symbol: "€", name: "Euro", label: "EUR – Euro (€)" },
  { value: "GBP", symbol: "£", name: "British Pound", label: "GBP – British Pound (£)" },
  { value: "JPY", symbol: "¥", name: "Japanese Yen", label: "JPY – Japanese Yen (¥)" },
  { value: "CNY", symbol: "¥", name: "Chinese Yuan", label: "CNY – Chinese Yuan (¥)" },
  { value: "INR", symbol: "₹", name: "Indian Rupee", label: "INR – Indian Rupee (₹)" },
  { value: "AED", symbol: "د.إ", name: "UAE Dirham", label: "AED – UAE Dirham (د.إ)" },
  { value: "SGD", symbol: "S$", name: "Singapore Dollar", label: "SGD – Singapore Dollar (S$)" },
  { value: "AUD", symbol: "A$", name: "Australian Dollar", label: "AUD – Australian Dollar (A$)" },
  { value: "CAD", symbol: "C$", name: "Canadian Dollar", label: "CAD – Canadian Dollar (C$)" },
  { value: "CHF", symbol: "Fr", name: "Swiss Franc", label: "CHF – Swiss Franc (Fr)" },
  { value: "HKD", symbol: "HK$", name: "Hong Kong Dollar", label: "HKD – Hong Kong Dollar (HK$)" },
  { value: "NOK", symbol: "kr", name: "Norwegian Krone", label: "NOK – Norwegian Krone (kr)" },
  { value: "SEK", symbol: "kr", name: "Swedish Krona", label: "SEK – Swedish Krona (kr)" },
  { value: "DKK", symbol: "kr", name: "Danish Krone", label: "DKK – Danish Krone (kr)" },
  { value: "NZD", symbol: "NZ$", name: "New Zealand Dollar", label: "NZD – New Zealand Dollar (NZ$)" },
  { value: "MYR", symbol: "RM", name: "Malaysian Ringgit", label: "MYR – Malaysian Ringgit (RM)" },
  { value: "PHP", symbol: "₱", name: "Philippine Peso", label: "PHP – Philippine Peso (₱)" },
  { value: "IDR", symbol: "Rp", name: "Indonesian Rupiah", label: "IDR – Indonesian Rupiah (Rp)" },
  { value: "THB", symbol: "฿", name: "Thai Baht", label: "THB – Thai Baht (฿)" },
  { value: "KRW", symbol: "₩", name: "South Korean Won", label: "KRW – South Korean Won (₩)" },
  { value: "PKR", symbol: "₨", name: "Pakistani Rupee", label: "PKR – Pakistani Rupee (₨)" },
  { value: "BDT", symbol: "৳", name: "Bangladeshi Taka", label: "BDT – Bangladeshi Taka (৳)" },
  { value: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", label: "LKR – Sri Lankan Rupee (Rs)" },
  { value: "SAR", symbol: "﷼", name: "Saudi Riyal", label: "SAR – Saudi Riyal (﷼)" },
  { value: "QAR", symbol: "﷼", name: "Qatari Riyal", label: "QAR – Qatari Riyal (﷼)" },
  { value: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar", label: "KWD – Kuwaiti Dinar (د.ك)" },
  { value: "BHD", symbol: ".د.ب", name: "Bahraini Dinar", label: "BHD – Bahraini Dinar (.د.ب)" },
  { value: "OMR", symbol: "﷼", name: "Omani Rial", label: "OMR – Omani Rial (﷼)" },
  { value: "ZAR", symbol: "R", name: "South African Rand", label: "ZAR – South African Rand (R)" },
  { value: "NGN", symbol: "₦", name: "Nigerian Naira", label: "NGN – Nigerian Naira (₦)" },
  { value: "EGP", symbol: "£", name: "Egyptian Pound", label: "EGP – Egyptian Pound (£)" },
  { value: "BRL", symbol: "R$", name: "Brazilian Real", label: "BRL – Brazilian Real (R$)" },
  { value: "MXN", symbol: "$", name: "Mexican Peso", label: "MXN – Mexican Peso ($)" },
  { value: "RUB", symbol: "₽", name: "Russian Ruble", label: "RUB – Russian Ruble (₽)" },
  { value: "TRY", symbol: "₺", name: "Turkish Lira", label: "TRY – Turkish Lira (₺)" },
  { value: "PLN", symbol: "zł", name: "Polish Zloty", label: "PLN – Polish Zloty (zł)" },
  { value: "CZK", symbol: "Kč", name: "Czech Koruna", label: "CZK – Czech Koruna (Kč)" },
  { value: "HUF", symbol: "Ft", name: "Hungarian Forint", label: "HUF – Hungarian Forint (Ft)" },
  { value: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", label: "UAH – Ukrainian Hryvnia (₴)" },
];

/** Map for quick symbol lookup: getCurrencySymbol("USD") → "$" */
export const getCurrencySymbol = (code: string): string => {
  return CURRENCIES.find((c) => c.value === code)?.symbol ?? code;
};

/** SearchableSelect-ready options */
export const CURRENCY_OPTIONS = CURRENCIES.map(({ value, label }) => ({
  value,
  label,
}));

// ---------------------------------------------------------------------------

export const COUNTRIES: CountryOption[] = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AR", label: "Argentina" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BE", label: "Belgium" },
  { value: "BR", label: "Brazil" },
  { value: "BG", label: "Bulgaria" },
  { value: "KH", label: "Cambodia" },
  { value: "CA", label: "Canada" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "HR", label: "Croatia" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "EG", label: "Egypt" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Ethiopia" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "HK", label: "Hong Kong" },
  { value: "HU", label: "Hungary" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KW", label: "Kuwait" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LT", label: "Lithuania" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "MX", label: "Mexico" },
  { value: "MA", label: "Morocco" },
  { value: "MM", label: "Myanmar" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NG", label: "Nigeria" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "RS", label: "Serbia" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "ZA", label: "South Africa" },
  { value: "KR", label: "South Korea" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "TW", label: "Taiwan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" },
];

/** SearchableSelect-ready options */
export const COUNTRY_OPTIONS = COUNTRIES.map(({ value, label }) => ({
  value,
  label,
}));