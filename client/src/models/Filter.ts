export interface Filter {
    id: number;
    type: 'empty' | 'date' | 'language' | 'country' | 'applicant' | 'inventor';
    isSelectionOpen: boolean;
    value: string;
}
