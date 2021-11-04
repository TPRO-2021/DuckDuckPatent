import { Filter } from '@/models/filter';

export default class FilterHelperService {
    static isValid(filter:Filter): boolean {

        let year1, year2;
        switch (filter.type) {
            case 'date':
                [year1, year2] = filter.value.split('-').map(t => parseInt(t, 10));
                return FilterHelperService.isValidYear(year1) && FilterHelperService.isValidYear(year2) && year2 > year1;
            case 'empty':
                return false;
            default: return !!filter.value;
        }
    }
    static isValidYear(year: number) {
                return !isNaN(year) && year > 1700 && year <= (new Date()).getFullYear();
        }

    static getParameterList(filters: Filter[]): string[] {


        // Prep the filter get parameters
        const filterParams = filters
            .filter((filter) => FilterHelperService.isValid(filter)) // Remove unfinished or mal-formed filters
            .map((filter) => `${filter.type}=${filter.value}`); // Convert to key=value strings
        return filterParams;
    }
}