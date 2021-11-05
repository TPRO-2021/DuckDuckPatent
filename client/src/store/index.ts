import { createStore } from 'vuex';
import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import { saveStatePlugin } from './SaveStatePlugin';
import { AppState } from './AppState';
import { SavedAppState } from './SavedAppState';
import { ExtendedPatent } from '@/models/ExtendedPatent';

export default createStore({
    state: new AppState(),
    /**
     * Mutation are functions that are responsible to mutate store state
     * !IMPORTANT they are synchronous
     */
    mutations: {
        /**
         * Sets the loading screen to visible
         * @param state
         */
        showLoadingScreen(state) {
            state.showLoadingScreen = true;
        },

        /**
         * Hides the loading screen
         * @param state
         */
        hideLoadingScreen(state) {
            state.showLoadingScreen = false;
        },
        /**
         * Sets the NoResultsToast to visible
         * @param state
         */
        SHOW_NORESULT_TOAST(state) {
            state.showNoResultsToast = true;
        },

        /**
         * Hides the NoResultsToast
         * @param state
         */
        HIDE_NORESULT_TOAST(state) {
            state.showNoResultsToast = false;
        },
        /**
         * Sets the showErrorToast to visible
         * @param state
         */
        SHOW_ERROR_TOAST(state) {
            state.showErrorToast = true;
        },

        /**
         * Hides the ErrorToast
         * @param state
         */
        HIDE_ERROR_TOAST(state) {
            state.showErrorToast = false;
        },
        /**
         * Add visualization option
         */
        addVisualizationOption(state, option: string) {
            state.visualizationOptions = [...state.visualizationOptions, option];
        },

        /**
         * Remove visualization option
         */
        removeVisualizationOption(state, option: string) {
            state.visualizationOptions = state.visualizationOptions.filter((t) => t !== option);
        },

        /**
         * Add empty filter
         */
        addFilter(state) {
            // Get the maxId and add one
            const newId = state.filters.reduce((a, b) => Math.max(a, b.id), -1) + 1;
            state.filters = [...state.filters, { id: newId, type: 'empty', value: '' } as Filter];
        },

        /**
         * Remove filter by id
         */
        removeFilter(state, id: number) {
            state.filters = state.filters.filter((t) => t.id !== id);
        },

        /**
         * Update filter
         */
        updateFilter<K extends keyof Filter>(state: AppState, args: { prop: K; value: Filter[K]; id: number }) {
            const startEdit = args.prop === 'isSelectionOpen';
            state.filters = state.filters
                .filter((t) => !startEdit || t.type !== 'empty') // If we're starting to edit one, delete all empties
                .map((filter: Filter) => {
                    // If this is not the one that is being updated
                    if (args.id !== filter.id) {
                        // Don't allow for the opening of more than one at a time - close if open
                        return filter.isSelectionOpen ? { ...filter, isSelectionOpen: false } : filter;
                    }
                    return {
                        ...filter, // Extend the current filter
                        value: args.prop === 'type' ? '' : filter.value, // Clear the value if we are asigning /changing type
                        isSelectionOpen: args.prop === 'type' || filter.isSelectionOpen, // If we just selected a type, we should show value selection
                        [args.prop]: args.value, // Set value
                    };
                });
        },

        /**
         * Update the state searchTerms array with new keyword
         * @param state mutations always have access to state as the first parameter
         * @param searchTerm the second parameter is option and represent the payload
         * in our case the mutations need access to the new inserted keyword to update the state arrays of searchTerms
         */
        ADD_SEARCH_TERM(state, searchTerm: string): void {
            // It can be important not to mutate state because it can cause unintended side-effects
            // Adding to an array using the spread operator [...] or concat() makes the code easier to reason
            // about because it can't change values outside of this code's scope.
            // More information on this general concept: https://www.geeksforgeeks.org/why-is-immutability-so-important-in-javascript/
            state.searchTerms = state.searchTerms.concat(searchTerm);
        },

        /**
         * Update the state of suggestedTerms when the user added to the search
         * @param state - access the state, it is a store for entire application
         * @param keywordSuggestions it is the new updated array after a keyword was added to search input
         */
        ADD_SUGGESTIONS(state, keywordSuggestions: string[]): void {
            state.suggestedTerms = keywordSuggestions;
        },

        /**
         * Update the state of Patents after a keyword was removed or inserted
         * @param state - a mandatory parameter for mutation to access the entire stored data
         * @param patents - patents objects after a search was performed
         * @constructor
         */
        ADD_PATENTS(state, patents: Patent[]): void {
            state.patents = patents;
        },

        /**
         * Update the total count variable
         * @param state
         * @param totalCount
         * @constructor
         */
        ADD_TOTAL_COUNT(state, totalCount: number): void {
            state.totalCount = totalCount;
        },

        /**
         * Update the searchTerms array after an element was removed
         * @param state the global point where all the data is stored
         * @param event the event that points to the removed search keyword from search input
         */
        REMOVE_SEARCH_TERM(state, event: { index: number; value: string }) {
            state.searchTerms = state.searchTerms.filter((_t, index) => index !== event.index);
        },

        /**
         * Clears the keywords and suggestions in input field
         * @param state
         * @constructor
         */
        CLEAR_INPUT(state) {
            state.searchTerms = [];
            state.suggestedTerms = [];
        },
        /**
         * Shows loading bar
         * @param state
         * @constructor
         */
        SHOW_LOADING_BAR(state) {
            state.showLoadingBar = true;
        },

        /**
         * Hides loading bar
         * @param state
         * @constructor
         */
        HIDE_LOADING_BAR(state) {
            state.showLoadingBar = false;
        },

        /**
         * Sets search terms to given value
         * @param state
         * @param terms
         * @constructor
         */
        SET_SEARCH_TERMS(state, terms: string[]): void {
            state.searchTerms = terms;
        },

        /**
         * Sets the current page value
         */
        SET_PAGE_COUNT(state, page: number): void {
            state.pageCount = page;
        },

        /**
         * Add the favorite patent to the container
         * @param state
         * @param savedPatent
         * @constructor
         */
        ADD_SAVED_PATENT(state, savedPatent: ExtendedPatent): void {
            const { patent } = savedPatent;

            if (state.savedPatents[patent.id]) {
                return;
            }

            state.savedPatents[patent.id] = savedPatent;
        },

        /**
         * Delete a patent from the saved results map
         * @param state
         * @param event
         * @constructor
         */
        REMOVE_SAVED_PATENT(state, event: { patent: Patent }) {
            delete state.savedPatents[event.patent.id];
        },
        /**
         * Switches highlight for node on
         * @param state
         * @param index - index of patent being previewed
         */
        HIGHLIGHT_NODE_ON(state, index: number) {
            state.patentIndex = index;
            state.highlightNode = true;
        },
        /**
         * Switches highlight for node off
         *
         */
        HIGHLIGHT_NODE_OFF(state) {
            state.patentIndex = -1;
            state.highlightNode = false;
        },

        /**
         * Load State
         * @param state
         * @param savedState
         */
        LOAD_STATE(state: SavedAppState, savedState: SavedAppState) {
            // Read the keys on the saved state
            const keys = Object.keys(savedState) as (keyof SavedAppState)[];
            // Set properties being loaded individually
            keys.forEach(<K extends keyof SavedAppState>(key: K) => {
                state[key] = savedState[key]; // Set property to value
            });
        },

        /**
         * Show the dialog mask on top of the content
         * @param state
         * @constructor
         */
        SHOW_DIALOG_MASK(state) {
            state.showDialogMask = true;
        },

        /**
         * Hide dialog mask from the screen
         * @param state
         * @constructor
         */
        HIDE_DIALOG_MASK(state) {
            state.showDialogMask = false;
        },
    },

    /**
     * Actions are similar to mutations, the differences being that:
     * Instead of mutating the state, actions commit mutations.
     * Actions can contain arbitrary asynchronous operations(getting data from database).
     */
    actions: {
        /**
         * Action to add new patents to the state. Additionally the total count is
         * committed
         * @param state
         * @param payload
         */
        addPatents(state, payload: { patents: Patent[]; totalCount: number; page: number | null }): void {
            state.commit('ADD_PATENTS', payload.patents);
            state.commit('ADD_TOTAL_COUNT', payload.totalCount);
            state.commit('SET_PAGE_COUNT', payload.page || 0);
        },

        /**
         * Load Saved State
         * @param store
         */
        loadSavedState(store) {
            // Load string 'state' from localstorage
            const stateAsString = window.localStorage.getItem('state');
            if (!stateAsString) {
                // If state is falsy, return (there's no state to load)
                return;
            }

            // Parse the saved state
            const newState = JSON.parse(stateAsString) as SavedAppState;

            store.commit('LOAD_STATE', newState);
        },

        /**
         * Reset Saved State
         * @param store
         */
        resetSavedState(store) {
            // load current state to preserve saved patents if possible
            const stateAsString = window.localStorage.getItem('state');
            const saveState = new SavedAppState();

            if (stateAsString) {
                const state = JSON.parse(stateAsString) as SavedAppState;
                saveState.savedPatents = state.savedPatents;
            }

            // set state to the previously created empty saved app state
            window.localStorage.setItem('state', JSON.stringify(saveState));

            // force load of new state
            store.commit('LOAD_STATE', saveState);
        },
    },

    /**
     * Getters are used to derive computed information from store state(one searchTerm from searchTerms array)
     */
    getters: {},
    modules: {},
    plugins: [saveStatePlugin],
});
