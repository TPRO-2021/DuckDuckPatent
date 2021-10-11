export interface Patent {
    id: string;
    title: string;
    date: Date | string;
    abstract: string;
    fulltext: string;
    citations: string[];
}
