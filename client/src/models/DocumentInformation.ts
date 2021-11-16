/**
 * This model represents a document information object belonging to a patent
 */
export interface DocumentInformation {
    formats: string[];
    type: string;
    url: string;
    sections: { name: string; startPage: string }[];
    pages: number;
}
