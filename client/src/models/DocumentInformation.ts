export interface DocumentInformation {
    formats: string[];
    type: string;
    url: string;
    sections: { name: string; startPage: string }[];
    pages: number;
}
