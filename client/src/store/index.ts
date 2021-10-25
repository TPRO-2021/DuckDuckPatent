import { createStore } from 'vuex';
import { Patent } from '@/models/Patent';

/**
 * The entire application views will have global containers to share data between components which is the state
 * This states are rendered in vue components as soon the states will be mutated
 */
export class AppState {
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
     * Holds the current search terms of the user
     */
    public searchTerms = [] as string[];

    /**
     * Holds the suggested terms related with search term of user
     */
    public suggestedTerms = [] as string[];

    /**

     * Holds the the patents as a result of research
     */
    public patents = [] as Patent[];

    /**
     * Container that store the saved patents mark as favorites
     */
    public savedPatents = [] as Patent[];

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
         * Update the searchTerms array after an element was removed
         * @param state the global point where all the data is stored
         * @param event the event that points to the removed search keyword from search input
         */
        REMOVE_SEARCH_TERM(state, event: { index: number; value: string }) {
            state.searchTerms = state.searchTerms.filter((_t, index) => index !== event.index);
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
    actions: {},

    /**
     * Getters are used to derive computed information from store state(one searchTerm from searchTerms array)
     */
    getters: {},
    modules: {},
});
