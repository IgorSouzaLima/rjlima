export function normalize(value?: string): string;
export function filterCities<T extends {city: string; state: string}>(cities: T[], query?: string, state?: string): T[];
export function validateQuote(quote: Record<string, string>, step: number): Record<string, string>;
export function quoteMessage(quote: Record<string, string>): string;
