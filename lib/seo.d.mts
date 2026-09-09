export const SITE_URL: string;
export const SITE_NAME: string;
export const HOME_TITLE: string;
export const HOME_DESCRIPTION: string;
export const PUBLIC_PATHS: string[];
export function indexableRequest(host: string | null, enabled?: boolean, preview?: boolean): boolean;
export function robotsText(indexable: boolean): string;
export function sitemapXml(): string;
export function organizationGraph(): Record<string, unknown>;
