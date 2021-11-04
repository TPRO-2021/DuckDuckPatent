<template>
    <div v-for="filter in filters" :key="filter.id" class="filter-container">
        <div v-if="filter.type === 'empty' || filter.isSelectionOpen" class="type-selection">
            <div>
                <ChipButton
                    :class="{ invisible: filter.type === 'date' || hasDate }"
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
                                @focus="updateFocus"
                                @change="onDateChange('from', $event, filter)"
                                @keyup="onDateChange('from', $event, filter)"
                            />
                            <input
                                id="dateTo"
                                ref="dateTo"
                                :value="dateFilterTo"
                                type="number"
                                @focus="updateFocus"
                                @change="onDateChange('to', $event, filter)"
                                @keyup="onDateChange('to', $event, filter)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <ChipButton
                    :class="{ invisible: filter.type === 'language' || hasLanguage }"
                    icon-key="add"
                    text="Language"
                    v-on:on-select="onUpdateFilter('type', 'language', filter.id)"
                ></ChipButton>
                <ListPicker
                    :class="{ invisible: filter.type !== 'language', 'value-selector': true }"
                    :selected="filter.value.split(',')"
                    :list="languageList"
                    v-on:select="onListItemSelected(filter, $event.key)"
                    v-on:scroll="updateFocus"
                />
            </div>

            <div>
                <ChipButton
                    :class="{ invisible: filter.type === 'country' || hasCountry }"
                    icon-key="add"
                    text="Country"
                    v-on:on-select="onUpdateFilter('type', 'country', filter.id)"
                ></ChipButton>
                <ListPicker
                    :class="{ invisible: filter.type !== 'country', 'value-selector': true }"
                    :selected="filter.value.split(',')"
                    :list="countryList"
                    v-on:select="onListItemSelected(filter, $event.key)"
                    v-on:scroll="updateFocus"
                />
            </div>
        </div>
        <div v-else-if="filter.type === 'date'">
            <FilterComponent
                name="date"
                :value="filter.value"
                v-on:edit="onEditClicked(filter.id)"
                v-on:delete="onRemoveClicked(filter.id)"
            />
        </div>
        <div v-else-if="filter.type === 'language'">
            <FilterComponent
                name="language"
                :value="displayValue(languageList, filter.value)"
                v-on:edit="onEditClicked(filter.id)"
                v-on:delete="onRemoveClicked(filter.id)"
            />
        </div>
        <div v-else-if="filter.type === 'country'">
            <FilterComponent
                name="country"
                :value="displayValue(countryList, filter.value)"
                v-on:edit="onEditClicked(filter.id)"
                v-on:delete="onRemoveClicked(filter.id)"
            />
        </div>
    </div>
    <ChipButton
        :class="{ invisible: currentFilter || hasAll, 'add-button': true }"
        icon-key="add"
        text="Add"
        v-on:on-select="onAddClicked()"
    ></ChipButton>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ChipButton from '@/components/ChipButton.vue';
import FilterComponent from '@/components/Filter.vue';
import ListPicker from '@/components/ListPicker.vue';
import { Filter } from '@/models/Filter';

const FOCUS_TIMEOUT_MS = 4000; // four seconds

export default defineComponent({
    name: 'Filters',
    components: { ChipButton, ListPicker, FilterComponent },
    props: {
        filters: {
            type: Array,
            required: true,
        },
    },
    data() {
        return {
            focusTimeout: null as number | null,
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
                { key: 'md', value: 'Republic of Moldovia' },
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
        };
    },
    watch: {
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
         *  @function returns a display value for a given key
         *  @param keys: string, keys to convert to display value
         *  @param list
         */
        displayValue(list: { key: string; value: string }[], keys: string): string {
            const codes = keys.split(',') as string[]; // Get the codes by spliting apart
            return codes
                .map((key) => list.find((t) => t.key === key)?.value) // Find the value for each key
                .filter((t) => t) // Remove values that could be found
                .join(', '); // Join together with a space and comma between each
        },
        /**
         *  @function onAddClicked emits an event to add an empty filter
         */
        onAddClicked(): void {
            // Emit add filter
            this.$emit('addFilter');
        },
        /**
         *  @function onRemoveClicked emits an event to remove a filter
         *  @param id: number, the client id of the filter being removed
         */
        onRemoveClicked(id: number): void {
            // Emit remove filter
            this.$emit('removeFilter', id);
        },
        /**
         *  @function onEditClicked emits an event to shift a filter into edit mode
         *  @param id: number, the client id of the filter being shifted into edit mode
         */
        onEditClicked(id: number): void {
            // Emit update filter that shifts a filter into edit mode
            this.$emit('updateFilter', { prop: 'isSelectionOpen', value: true, id });
            this.updateFocus(); // Update the focus so the user doesn't have to make a change if they don't want
        },
        /**
         *  @function onUpdateFilter emits an event update a filter
         *  @param id: number, the client id of the filter being removed
         *  @param prop: K, the property to be updated
         *  @param value: Filter[K], the value of the new prop
         */
        onUpdateFilter<K extends keyof Filter>(prop: K, value: Filter[K], id: number): void {
            // Emit update filter
            this.$emit('updateFilter', { prop, value, id });
        },

        /**
         *  @function onDateChange handles text input event that should update a date filter
         *  @param fromTo: 'from' | 'to', either 'from' or 'to'
         *  @param event: Event, the input element event
         *  @param filter: Filter[K], the value of the new prop
         */
        onDateChange(fromTo: 'from' | 'to', event: Event, filter: Filter) {
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
            this.updateFocus(); // Update the focus so the user doesn't get kicked out of editing
        },

        /**
         *  @function updateFocus updates the timer that goes off when the user hasn't done anything for a set amount of time
         */
        updateFocus() {
            // This timeout might be null
            if (this.focusTimeout != null) {
                clearTimeout(this.focusTimeout); // Stop the scheduled timeout
            }
            this.focusTimeout = setTimeout(() => {
                // Create a new scheduled timeout
                this.onLostFocus(); // Shift back from edit when called
            }, FOCUS_TIMEOUT_MS); // Timeout given here
        },

        /**
         *  @function  onLostFocus shifts the current filter from edit mode to not edit mode
         */
        onLostFocus() {
            if (this.currentFilter == null) {
                return;
            } // If there isn't a currently focused element then forget about it
            // Emit update that changes isSelectionOpen (edit mode) to false
            this.$emit('updateFilter', { prop: 'isSelectionOpen', value: false, id: this.currentFilter.id });
            // Set the current filter to null, it's no longer current
            this.currentFilter = null;
        },

        /**
         *  @function onListItemSelected handles updating lists when items are selected
         */
        onListItemSelected(filter: Filter, key: string) {
            const codes = (filter.value || '').split(',').filter((t) => t); // Get all the current comma delinated items
            let newCodes = [...codes, key]; // Add the new item for the case where it's not already selected
            if (codes.includes(key)) {
                // If it has been already selected, we need to remove not add
                newCodes = codes.filter((t) => t !== key); // Remove key from new list
            }
            this.onUpdateFilter('value', newCodes.join(','), filter.id); // Join new list together with commas and update the value
            this.updateFocus(); // Update focus so the user doesn't just randomly get knocked out of edit mode
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
    max-width: 120px;
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
    margin: 5px;
}
.year-selector > * > label {
    text-align: left;
}
.year-selector > * > input {
    border-radius: 5px;
    background: lightgrey;
    border: none;
    padding: 0 5px;
}

.filter-container {
    margin-top: 10px;
}

.type-selection {
    display: flex;
    justify-content: space-between;
    min-height: 2em;
}
.type-selection > * {
}

.add-button {
    margin-top: 8px;
    float: right;
    width: 90px;
}
.invisible {
    visibility: hidden;
}
.value-selector {
    margin-top: -2.1em;
}
</style>
