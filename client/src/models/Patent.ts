/**
 * This interface represents the patent data structure
 */
export interface Patent {
    id: string;
    abstract?: string;
    title?: string;
    citations?: Patent[];
}
