export interface Filter {
    id: number;
    type: 'empty' | 'date' | 'language' | 'country';
    isSelectionOpen: boolean;
    isLast: boolean;
    value: string;
}
