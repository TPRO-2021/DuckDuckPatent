import { createStore } from 'vuex';
import { Patent } from '@/models/Patent';

/**
 * The entire application views will have global containers to share data between components which is the state
 * This states are rendered in vue components as soon the states will be mutated
 */
export class AppState {
    /**
     * Holds the the patents as a result of research
     */
    public patents = [] as Patent[];

    /**
     * Holds the current result page count
     */
    public pageCount = 0;

    /**
     * Holds the loadingScreen state
     * True if the loading screen should be visible
     */
    public showLoadingScreen = false;

    /**
     * Holds the loadingBar state
     * True if the loadingBar should be visible
     */
    public showLoadingBar = false;
    /**
     * Holds the showNoResultsToast state
     * True if the toast should be visible
     */
    public showNoResultsToast = false;
    /**
     * Holds the showErrorToast state
     * True if the toast should be visible
     */
    public showErrorToast = false;

    /**
     * Holds the current search terms of the user
     */
    public searchTerms = [] as string[];

    /**
     * Holds the suggested terms related with search term of user
     */
    public suggestedTerms = [] as string[];

    /**
     * Container that store the saved patents mark as favorites
     */
    public savedPatents = [] as Patent[];

    /**
     * Holds the current total count value
     */
    public totalCount = 0;

    /**
     * Node visualization options
     */
    public visualizationOptions = ['patents'];
}

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
        SHOW_NORESULTS_TOAST(state) {
            state.showNoResultsToast = true;
        },

        /**
         * Hides the NoResultsToast
         * @param state
         */
        HIDE_NORESULTS_TOAST(state) {
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
        ADD_SAVED_PATENT(state, savedPatent: Patent): void {
            state.savedPatents.push(savedPatent);
        },

        REMOVE_SAVED_PATENT(state, event: { index: number; value: Patent }) {
            state.savedPatents = state.savedPatents.filter((_t, index) => index !== event.index);
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
    },

    /**
     * Getters are used to derive computed information from store state(one searchTerm from searchTerms array)
     */
    getters: {},
    modules: {},
});
