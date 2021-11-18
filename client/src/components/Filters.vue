<template>
    <div v-for="filter in filters" :key="filter.id" class="filter-container">
        <!-- Date filter -->
        <div v-if="eligible(filter, 'date')">
            <FilterComponent
                name="date"
                :value="filter.value"
                :filter="filter"
                v-on:edit="onEditClicked(filter.id)"
                v-on:delete="onRemoveClicked(filter.id)"
            />
        </div>

        <!-- Language filter -->
        <div v-if="eligible(filter, 'language')">
            <FilterComponent
                name="language"
                :value="displayValue(languageList, filter.value)"
                :filter="filter"
                v-on:edit="onEditClicked(filter.id)"
                v-on:delete="onRemoveClicked(filter.id)"
            />
        </div>

        <!-- Country filter -->
        <div v-if="eligible(filter, 'country')">
            <FilterComponent
                name="country"
                :value="displayValue(countryList, filter.value)"
                :filter="filter"
                v-on:edit="onEditClicked(filter.id)"
                v-on:delete="onRemoveClicked(filter.id)"
            />
        </div>

        <!-- Filter buttons -->
        <div
            v-if="filter.type === 'empty' || filter.isSelectionOpen"
            class="type-selection"
            v-vue-click-away="onLostFocus"
        >
            <div>
                <ChipButton
                    :class="{
                        invisible:
                            filter.type === 'date' ||
                            hasDate ||
                            (this.showOnEdit.status && this.showOnEdit.filterType !== 'date'),
                    }"
                    icon-key="add"
                    text="Date"
                    v-on:on-select="onUpdateFilter('type', 'date', filter.id)"
                ></ChipButton>
                <div
                    :class="{ invisible: filter.type !== 'date', 'year-selector-target': true, 'value-selector': true }"
                >
                    <div class="year-selector">
                        <div>
                            <label for="dateFrom">from</label>
                            <label for="dateTo">to</label>
                        </div>
                        <div>
                            <input
                                id="dateFrom"
                                ref="dateFrom"
                                :value="dateFilterFrom"
                                type="number"
                                @keyup="onDateChange('from', $event, filter)"
                            />
                            <input
                                id="dateTo"
                                ref="dateTo"
                                :value="dateFilterTo"
                                type="number"
                                @keyup="onDateChange('to', $event, filter)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <ChipButton
                    :class="{
                        invisible:
                            filter.type === 'language' ||
                            hasLanguage ||
                            (this.showOnEdit.status && this.showOnEdit.filterType !== 'language'),
                    }"
                    icon-key="add"
                    text="Language"
                    v-on:on-select="onUpdateFilter('type', 'language', filter.id)"
                ></ChipButton>
                <ListPicker
                    :class="{ invisible: filter.type !== 'language', 'value-selector': true }"
                    :selected="filter.value.split(',')"
                    :list="languageList"
                    v-on:select="onListItemSelected(filter, $event.key)"
                />
            </div>

            <div>
                <ChipButton
                    :class="{
                        invisible:
                            filter.type === 'country' ||
                            hasCountry ||
                            (this.showOnEdit.status && this.showOnEdit.filterType !== 'country'),
                    }"
                    icon-key="add"
                    text="Country"
                    v-on:on-select="onUpdateFilter('type', 'country', filter.id)"
                ></ChipButton>
                <ListPicker
                    :class="{ invisible: filter.type !== 'country', 'value-selector': true }"
                    :selected="filter.value.split(',')"
                    :list="countryList"
                    v-on:select="onListItemSelected(filter, $event.key)"
                />
            </div>
        </div>
    </div>
    <div class="filter-bottom-controls">
        <ChipButton
            :class="{ isHidden: currentFilter || hasAll, 'add-button': true }"
            icon-key="add"
            text="Add"
            v-on:on-select="onAddClicked()"
        ></ChipButton>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ChipButton from '@/components/ChipButton.vue';
import FilterComponent from '@/components/Filter.vue';
import ListPicker from '@/components/ListPicker.vue';
import { Filter } from '@/models/Filter';
import { directive } from 'vue3-click-away';
import FilterHelperService from '@/services/filter-helper.service';

/**
 * Filters component which adds language, country and date filters
 */
export default defineComponent({
    name: 'Filters',
    components: { ChipButton, ListPicker, FilterComponent },
    props: {
        filters: {
            type: Array,
            required: true,
        },
    },
    directives: {
        VueClickAway: directive,
    },
    data() {
        return {
            currentFilter: null as Filter | null,
            hasDate: false,
            hasLanguage: false,
            hasCountry: false,
            hasAll: false,
            dateFilterFrom: '',
            dateFilterTo: '',
            dateChangeDebounce: -1,
            languageList: [
                // Language list (incomplete)
                { key: 'en', value: 'English' },
                { key: 'de', value: 'German' },
                { key: 'fr', value: 'French' },
                { key: 'es', value: 'Spanish' },
            ],
            countryList: [
                // Country list (Potentially incomplete)
                { key: 'at', value: 'Austria' },
                { key: 'be', value: 'Belgium' },
                { key: 'bg', value: 'Bulgaria' },
                { key: 'ca', value: 'Canada' },
                { key: 'ch', value: 'Switzerland' },
                { key: 'cn', value: 'China' }, // Unsure if included
                { key: 'cy', value: 'Cyprus' },
                { key: 'cz', value: 'Czech Republic' },
                { key: 'dk', value: 'Denmark' },
                { key: 'de', value: 'Germany' },
                { key: 'ee', value: 'Estonia' },
                { key: 'es', value: 'Spain' },
                { key: 'fr', value: 'France' },
                { key: 'gb', value: 'United Kingdom' },
                { key: 'us', value: 'United States' }, // Unsure if included
                { key: 'gr', value: 'Greece' },
                { key: 'hr', value: 'Croatia' },
                { key: 'ie', value: 'Ireland' },
                { key: 'it', value: 'Italy' },
                { key: 'lt', value: 'Lithuania' },
                { key: 'lu', value: 'Luxembourg' },
                { key: 'mc', value: 'Monaco' },
                { key: 'md', value: 'Republic of Moldova' },
                { key: 'me', value: 'Montenegro' },
                { key: 'no', value: 'Norway' },
                { key: 'pl', value: 'Poland' },
                { key: 'pt', value: 'Portugal' },
                { key: 'ro', value: 'Romania' },
                { key: 'rs', value: 'Serbia' },
                { key: 'ru', value: 'Russia' }, // Unsure if included
                { key: 'se', value: 'Sweden' },
                { key: 'sk', value: 'Slovakia' },
            ],
            showOnEdit: {
                status: false,
                filterType: 'none',
            },
        };
    },
    watch: {
        /**
         * Watches the filters array and updates the filters on a change
         *
         * @param value The new filters value
         */
        filters(value): void {
            if (value == null) {
                return;
            }

            const filters = value as Filter[];
            this.hasDate = filters.some((t) => t.type === 'date');
            this.hasLanguage = filters.some((t) => t.type === 'language');
            this.hasCountry = filters.some((t) => t.type === 'country');
            this.hasAll = this.hasDate && this.hasLanguage && this.hasCountry;

            this.currentFilter = filters.find((t) => t.type === 'empty' || t.isSelectionOpen) ?? null;
            if (this.currentFilter == null) {
                return;
            }

            const yearParts = this.currentFilter.value.split('-');
            this.dateFilterFrom = `${yearParts[0] ?? ''}`;
            this.dateFilterTo = `${yearParts[1] ?? ''}`;
        },
    },
    emits: ['addFilter', 'removeFilter', 'updateFilter'],
    methods: {
        /**
         *  Returns a display value for a given key
         *
         *  @param keys The keys to convert to display value
         *  @param list The current list of keys
         */
        displayValue(list: { key: string; value: string }[], keys: string): string {
            const codes = keys.split(',') as string[]; // Get the codes by spliting apart
            return codes
                .map((key) => list.find((t) => t.key === key)?.value) // Find the value for each key
                .filter((t) => t) // Remove values that could be found
                .join(', '); // Join together with a space and comma between each
        },

        /**
         *  Event handler which emits the 'add-filter' event which should add an empty filter
         */
        onAddClicked(): void {
            //reset Edit
            this.showOnEdit = { status: false, filterType: 'none' };
            // Emit add filter
            this.$emit('addFilter');
        },

        /**
         *  Event handler which emits the 'remove-filter' event to the parent
         *
         *  @param id   The client id of the filter being removed
         */
        onRemoveClicked(id: number): void {
            // Emit remove filter
            this.$emit('removeFilter', id);
        },

        /**
         *  Event handler which emits the 'update-filter'-event to shift a filter into edit mode
         *
         *  @param id the client id of the filter being shifted into edit mode
         */
        onEditClicked(id: number): void {
            // if editing a filter, other options should not show
            this.showOnEdit = { status: true, filterType: this.$store.state.filters[id].type };
            // Emit update filter that shifts a filter into edit mode
            this.$emit('updateFilter', { prop: 'isSelectionOpen', value: true, id });
        },

        /**
         *  Event handler which emits the 'update-filter' event to the parent component
         *
         *  @param id   The client id of the filter being removed
         *  @param prop The property to be updated
         *  @param value    The value of the new prop
         */
        onUpdateFilter<K extends keyof Filter>(prop: K, value: Filter[K], id: number): void {
            // Emit update filter
            this.$emit('updateFilter', { prop, value, id });
        },

        /**
         *  Handles text input event that should update a date filter
         *
         *  @param fromTo   The date type ('from' or 'to')
         *  @param event    The input element event
         *  @param filter   The value of the new prop
         */
        onDateChange(fromTo: 'from' | 'to', event: Event, filter: Filter) {
            // clearing the previous timeout to avoid duplicate requests
            clearTimeout(this.dateChangeDebounce);

            this.dateChangeDebounce = setTimeout(() => {
                // Because this gets called on every keyup, we need to "debounce" it
                const fromElem = this.$refs.dateFrom as HTMLInputElement; // Cast int HTMLInputElement to make TS happy
                const toElem = this.$refs.dateTo as HTMLInputElement; // Cast int HTMLInputElement to make TS happy
                const fromValue = fromElem?.value ?? ''; // Either get the new value or empty string
                const toValue = toElem?.value ?? ''; // Either get the new value or empty string
                const dateRange = `${fromValue}-${toValue}`; // Create new date range
                this.$emit('updateFilter', { prop: 'value', value: dateRange, id: filter.id }); // Emit update filter with new date range
            }, 500); // .5 sec
        },

        /**
         *  Event handler which shifts the current filter from edit mode to not edit mode.
         *  When user clicks away from filters, it's treated as lost focus too.
         */
        onLostFocus() {
            if (this.currentFilter === null) {
                return;
            } // If there isn't a currently focused element then forget about it

            // Emit update that changes isSelectionOpen (edit mode) to false
            this.$emit('updateFilter', { prop: 'isSelectionOpen', value: false, id: this.currentFilter.id });
            this.showOnEdit = { status: false, filterType: 'none' };

            // if filter is really empty, i.e. user didn't enter any values, then we should not display it
            if (!FilterHelperService.isValid(this.currentFilter)) {
                this.$emit('removeFilter', this.currentFilter.id);
            }
            // Set the current filter to null, it's no longer current
            this.currentFilter = null;
        },

        /**
         * Event handler which handles updating lists when items are selected
         *
         * @param filter    The current filter
         * @param key   The filter key
         */
        onListItemSelected(filter: Filter, key: string) {
            const codes = (filter.value || '').split(',').filter((t) => t); // Get all the current comma delinated items
            let newCodes = [...codes, key]; // Add the new item for the case where it's not already selected
            if (codes.includes(key)) {
                // If it has been already selected, we need to remove not add
                newCodes = codes.filter((t) => t !== key); // Remove key from new list
            }

            this.onUpdateFilter('value', newCodes.join(','), filter.id); // Join new list together with commas and update the value
        },

        /**
         * Checks whether filter meets all conditions to be displayed to user
         *
         * @param filter    The filter which should be checked
         * @param filterType    The filter type
         */
        eligible(filter: Filter, filterType: string): boolean {
            return FilterHelperService.showFilter(filter, filterType);
        },
    },
});
</script>

<style lang="scss" scoped>
.year-selector-target {
    display: block;
    height: 1em;
    max-width: 150px;
}
.year-selector {
    display: flex;
    flex-direction: row;
    border-radius: 5px;
    background-color: white;
    box-shadow: 0 0 10px grey;
    box-sizing: border-box;
    padding: 10px 5px;
    position: relative;
    z-index: 2000;
}
.year-selector > * {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}
.year-selector > * > * {
    width: 90%;
}
.year-selector > * > label {
    text-align: left;
    margin: 3px;
}
.year-selector > * > input {
    border-radius: 5px;
    background: lightgrey;
    border: none;
    padding: 0 5px;
    margin: 5px;
}

.filter-container {
    margin: 10px 5px;
}
.filter-bottom-controls {
    margin-right: 5px;
    margin-left: 5px;
}
.type-selection {
    display: flex;
    justify-content: space-between;
    min-height: 2em;
}

.add-button {
    margin-top: 8px;
    float: right;
    width: 90px;
    //  margin-right: 0 !important;
}
.invisible {
    visibility: hidden;
}
.isHidden {
    display: none;
}
.value-selector {
    margin-top: -2.1em;
}
</style>
