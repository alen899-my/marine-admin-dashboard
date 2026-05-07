// Default currency settings for consistent formatting
// Used when no settings are provided to formatCurrency functions
// These can be updated via setCurrencySettings() from the settings page

export interface CurrencySettings {
    currencySymbol: string;
    currencyCode: string;
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
}

// Default fallback settings (used when no settings are initialized)
const defaultCurrencySettings: CurrencySettings = {
    currencySymbol: "$",
    currencyCode: "USD",
    currencyPosition: "left",
    currencyFormatType: "symbol",
    currencySpace: true,
};

// Global settings store - initialized by SettingsClient and used by formatCurrency
let globalCurrencySettings: CurrencySettings = { ...defaultCurrencySettings };
let settingsInitialized = false;

/**
 * Get current currency settings
 * Returns the currently configured settings (from global store)
 */
export function getCurrencySettings(): CurrencySettings {
    return globalCurrencySettings;
}

/**
 * Set currency settings (called from SettingsClient)
 * Updates the global settings store
 */
export function setCurrencySettings(settings: Partial<CurrencySettings>): void {
    globalCurrencySettings = { ...globalCurrencySettings, ...settings };
    settingsInitialized = true;
}

/**
 * Check if settings have been initialized
 */
export function areSettingsInitialized(): boolean {
    return settingsInitialized;
}

/**
 * Reset to default settings
 */
export function resetCurrencySettings(): void {
    globalCurrencySettings = { ...defaultCurrencySettings };
    settingsInitialized = false;
}

