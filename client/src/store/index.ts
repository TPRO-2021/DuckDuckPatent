import { createStore } from 'vuex';

export class AppState {
    /**
     * True if the loading screen should be visible
     */
    public showLoadingScreen = false;
}

export default createStore({
    state: new AppState(),
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
    },
    actions: {},
    modules: {},
});
