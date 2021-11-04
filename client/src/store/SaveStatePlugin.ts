import { MutationPayload, Store } from 'vuex';
import { AppState } from './AppState';
import { SavedAppState } from './SavedAppState';

export function saveStatePlugin(store: Store<AppState>): void {
    store.subscribe((mutation: MutationPayload, state: AppState) => {
        // Comment out items you don't want to be a part of the saved state here
        const saveState: SavedAppState = {
            searchTerms: state.searchTerms,
            suggestedTerms: state.suggestedTerms,
            visualizationOptions: state.visualizationOptions,
            savedPatents: state.savedPatents,
            filters: state.filters,
        };

        const stateAsString = JSON.stringify(saveState);
        window.localStorage.setItem('state', stateAsString);
    });
}
