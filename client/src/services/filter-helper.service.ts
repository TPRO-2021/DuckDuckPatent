import { Filter } from '@/models/Filter';

/**
 * Service which provides utility functions used by the filter component
 */
export default class FilterHelperService {
    /**
     * Checks a filter reference for its validity
     * @param filter    The filter reference which should be checked
     */
    static isValid(filter: Filter): boolean {
        let year1;
        let year2;

        switch (filter.type) {
            case 'date':
                [year1, year2] = filter.value.split('-').map((t: string) => parseInt(t, 10));

                //Check the validity of the inputted numbers
                return (
                    FilterHelperService.isValidYear(year1) && FilterHelperService.isValidYear(year2) && year2 > year1
                );
            case 'empty':
                return false;
            default:
                return !!filter.value;
        }
    }

    /**
     * Checks a year for its validity
     *
     * @param year  The year which should be checked
     */
    static isValidYear(year: number): boolean {
        return !isNaN(year) && year > 1700 && year <= new Date().getFullYear();
    }

    /**
     * Compiles a string array of parameter key=value strings
     *
     * @param filters   The filters which should be used for the parameter list
     */
    static getParameterList(filters: Filter[]): string[] {
        return filters
            .filter((filter) => FilterHelperService.isValid(filter)) // Remove unfinished or mal-formed filters
            .map((filter) => `${filter.type}=${filter.value}`);
    }

    /**
     * Only filters that are added to store and are being edited are to be shown. If not being edited, filter values should not be empty.
     *
     * @param filter    The filters
     * @param currentType   The current type
     */
    static showFilter(filter: Filter, currentType: string): boolean {
        return filter.type === currentType && (filter.value !== '' || filter.isSelectionOpen);
    }
}
