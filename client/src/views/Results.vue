<template>
    <div class="container">
        <!-- This div contains searchbar and options menu -->
        <div class="top-left-controls">
            <!-- This div contains the searchbar and keyword suggestions -->
            <div class="search-input card box-shadow">
                <Searchbar
                    :search-terms="terms"
                    @input-focused="inputFieldWaiting = true"
                    @input-not-focused="inputFieldWaiting = false"
                    v-on:on-add-keyword="onAddKeyword"
                    v-on:on-search="refreshResults"
                    v-on:on-remove-keyword="onRemoveKeyword"
                ></Searchbar>
                <KeywordSuggestions
                    :provided-keywords="suggestedTerms"
                    v-on:on-add-keyword="onAddKeyword"
                ></KeywordSuggestions>
            </div>
            <!-- This div contains the options menu for user to add more nodes/filters -->
            <div class="options-menu">
                <OptionsMenu
                    :options="visualizationOptions"
                    :filters="filters"
                    v-on:add-node="$store.commit('addVisualizationOption', $event)"
                    v-on:remove-node="$store.commit('removeVisualizationOption', $event)"
                    v-on:add-filter="$store.commit('addFilter', $event)"
                    v-on:remove-filter="$store.commit('removeFilter', $event)"
                    v-on:update-filter="$store.commit('updateFilter', $event)"
                />
            </div>
        </div>
        <!-- Result visualization component -->
        <div class="result-wrapper">
            <ResultsVisualization
                :visualization-options="visualizationOptions"
                :patents="patents"
                :updating="showLoadingBar"
                v-on:on-node-selected="onNodeSelected"
                v-on:on-clear-node-selected="onClearNodeSelected"
            />
        </div>

        <!-- This div contains the bottom controls (timeline toggle, mode-toggle) -->
        <div class="bottom-controls">
            <Button
                v-if="moreDataAvailable"
                v-on:on-clicked="extendSearch"
                icon-key="check"
                btn-text="Load more"
            ></Button>
        </div>

        <!-- This div contains the top right controls (saved button) -->
        <div class="top-controls">
            <Button
                btnText="Saved"
                iconKey="turned_in"
                :badge-value="savedPatentsCount"
                v-on:on-clicked="openSavePage"
            />
        </div>

        <!-- Patent/Node Previews -->
        <div class="patent-preview" v-if="isPreviewActive">
            <PatentPreviewComponent
                v-if="currentPatentPreview"
                :current="currentPatentPreview"
                :terms="terms"
                v-on:on-change-patent="onChangeNode($event, allPatentIds, 'patent')"
                v-on:on-save-patent="onSavePatent($event)"
                v-on:on-show-more="onShowMore($event)"
            />
            <PatentPreviewComponent
                v-if="citationSelected"
                :current="currentCitation"
                :terms="terms"
                :is-async-resource="true"
                v-on:on-change-patent="onChangeNode($event, allPatentIds, 'patent')"
                v-on:on-save-patent="onSavePatent($event)"
                v-on:on-show-more="onShowMore($event)"
            />
            <NodePreviewComponent
                v-if="currentNodePreview"
                :current="currentNodePreview"
                v-on:on-select-patent="selectPatent($event)"
            />
        </div>

        <!-- Detailed patent view that shows up if the detailed view is requested for a patent -->
        <DetailedPatentView
            :extended-patent="detailedPatent"
            v-on:on-close="
                detailedPatent = null;
                this.$store.commit('HIDE_DIALOG_MASK');
            "
            v-on:on-save-patent-detailed="onSavePatentDetailed($event)"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PatentService from '@/services/patent.service';
import PreviewHelperService from '@/services/preview-helper.service';
import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import { PatentPreview } from '@/models/PatentPreview';
import { NodePreview } from '@/models/NodePreview';
import { NodeInfo } from '@/models/NodeInfo';
import { NodeType } from '@/models/NodeType';
import Searchbar from '@/components/Searchbar.vue';
import PatentPreviewComponent from '@/components/PatentPreview.vue';
import NodePreviewComponent from '@/components/NodePreview.vue';
import KeywordSuggestions from '@/components/KeywordSuggestions.vue';
import KeywordService from '@/services/keyword.service';
import OptionsMenu from '@/components/OptionsMenu.vue';
import ResultsVisualization from '@/components/ResultVisualization.vue';
import Button from '@/components/Button.vue';
import DetailedPatentView from '@/components/DetailedPatentView.vue';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import FilterHelperService from '@/services/filter-helper.service';

/**
 * View which is responsible for displaying the /search page containing the results
 */
export default defineComponent({
    name: 'Results',
    components: {
        Button,
        DetailedPatentView,
        KeywordSuggestions,
        NodePreviewComponent,
        OptionsMenu,
        PatentPreviewComponent,
        ResultsVisualization,
        Searchbar,
    },
    data() {
        return {
            citationSelected: false,
            currentCitation: null as PatentPreview | null,
            debounceHandler: null as number | null,
            detailedPatent: null as ExtendedPatent | null,
            inputFieldWaiting: false,
            keywordService: new KeywordService(),
            lastFilterString: '',
            moreDataAvailable: false,
            patentService: new PatentService(),
            resetHandler: null as number | null,
            resetWaiting: false,
            selectedNode: null as NodeInfo | null,
            showTimeline: false,
        };
    },
    watch: {
        /**
         * Watches the filters and refreshes the result after a specified timeout
         * @param filters
         */
        filters(filters: Filter[]): void {
            // On every change of the filters we need to check if we should update the results
            // Create a filter string that we can compare to recently sent ones (this could be refactored)
            const newFilterString = FilterHelperService.getParameterList(filters).join('&'); // Convert to "key=value&key2=value2" string

            // Compare the string with the last sent, if they're different, refresh the results
            if (newFilterString !== this.lastFilterString) {
                this.lastFilterString = newFilterString; // Update the last observed filter string for next time
                this.debounce(4000); // Refresh the results after 3 seconds
            }
        },
    },
    computed: {
        /**
         * Gets the loading bar status from the store
         */
        showLoadingBar(): boolean {
            return this.$store.state.showLoadingBar;
        },
        /**
         * Gets the filters from the store
         */
        filters(): Filter[] {
            return this.$store.state.filters;
        },
        /**
         * Gets the visualization options from the store
         */
        visualizationOptions(): string[] {
            return this.$store.state.visualizationOptions;
        },
        /**
         * Gets the search terms from the store
         */
        terms(): string[] {
            return this.$store.state.searchTerms;
        },
        /**
         * Gets the suggested terms from the store
         */
        suggestedTerms(): string[] {
            return this.$store.state.suggestedTerms;
        },
        /**
         * Gets the current patents from the store
         */
        patents(): Patent[] {
            return this.$store.state.patents;
        },
        /**
         * Gets the total count from the store
         */
        totalCount(): number {
            return this.$store.state.totalCount;
        },
        /**
         * Returns the number of available pages based on the total count returned from OPS. Currently
         * a page size of 100 is used, since that is the max. amount of patents we are able to retrieve from
         * OPS with one request
         */
        availablePages(): number {
            return this.totalCount / 100;
        },
        /**
         * Gets the current page number from the store
         */
        currentPage(): number {
            return this.$store.state.pageCount;
        },
        /**
         * Returns the number of currently saved patents which is used to display
         * a badge on the saved button
         */
        savedPatentsCount(): string {
            // if no patent is saved no badge should be displayed!
            if (Object.keys(this.$store.state.savedPatents).length === 0) {
                return '';
            }

            return Object.keys(this.$store.state.savedPatents).length.toString();
        },
        /**
         * Returns the current PatentPreview object which is used for displaying the patent
         * preview. If no patent is selected it returns null
         */
        currentPatentPreview(): PatentPreview | null {
            // no patent node selected --> return null
            if (this.selectedNode == null || this.selectedNode.type !== 'patent') {
                return null;
            }

            // find the patent in the current patents array;
            const patent = this.patents.find((t) => t.id === this.selectedNode?.id);

            if (patent == undefined) {
                return null;
            }

            const savedPatents = this.$store.state.savedPatents;
            return PreviewHelperService.getPatentPreview(patent, savedPatents);
        },
        /**
         * Returns the current NodePreview based on the selected node type. If node is null or no matching node type
         * was found it will return null
         */
        currentNodePreview(): NodePreview | null {
            switch (this.selectedNode?.type) {
                case 'author':
                    return PreviewHelperService.getPreview(
                        this.selectedNode,
                        this.$store.state.patents,
                        'inventors',
                        '',
                        'Inventor of',
                    );
                case 'company':
                    return PreviewHelperService.getPreview(
                        this.selectedNode,
                        this.$store.state.patents,
                        'applicants',
                        '',
                        'Applicant of',
                    );
                default:
                    return null;
            }
        },
        /**
         * Returns a boolean which indicates whether the preview is active or not. The value is determined
         * by using the locally available selectedNode reference
         */
        isPreviewActive(): boolean {
            return this.selectedNode != null;
        },
        /**
         * Returns a string array of all patentIds derived from the patents array
         */
        allPatentIds(): string[] {
            return this.patents.map((t) => t.id);
        },
    },
    async created() {
        // show loading screen
        this.$store.commit('SHOW_LOADING_SCREEN');

        // since the store is not preserved in a refresh we need to check the current URL for keywords
        this.checkUrl();

        // if no search-term is present change back to the search page!
        if (this.terms.length === 0) {
            await this.$router.push({ path: '/' });
        }

        // refresh results and keywords
        this.refreshKeywords();
        await this.refreshResults();

        // now we can check the result
        this.checkResult();
    },
    methods: {
        /**
         * Function which delays refreshing the screen for provided time, i.e. debounce client requests.
         * Since the Searchbar.vue is only responsible for converting terms to chips and sending them over,
         * delay of the requests is fully handled here.
         *
         * If input focused, delay increases by half the time. Oftentimes users don't click the icon to initiate search,
         * hence it might be better to simply prolong existing delay to allow for further search inputs.
         *
         * @param debounceTime  The debounce time in milliseconds
         */
        debounce(debounceTime: number): void {
            if (this.debounceHandler) {
                clearTimeout(this.debounceHandler);
            }

            if (this.inputFieldWaiting) {
                debounceTime += debounceTime / 2;
            }

            this.debounceHandler = setTimeout(async () => {
                await this.refreshResults();
                this.inputFieldWaiting = false;
                this.selectedNode = null; //to reset the patent preview if it was active before
            }, debounceTime);
        },

        /**
         * Adds a keyword to the current search terms and triggers a result refresh + debouncing the request
         *
         * @param event The event containing the passed up keyword
         */
        async onAddKeyword(event: { value: string }): Promise<void> {
            this.resetWaiting ? this.cancelReset() : '';
            this.$store.commit('ADD_SEARCH_TERM', event.value);
            this.refreshKeywords();
            this.debounce(2000);
        },

        /**
         * Removes a keyword from the current search terms and triggers a result refresh + debouncing the request
         *
         * @param event
         */
        async onRemoveKeyword(event: { value: string; index: number }) {
            // cancel timout if new debounce was requested
            this.resetWaiting ? this.cancelReset() : '';

            // remove the search term and refresh keywords
            this.$store.commit('REMOVE_SEARCH_TERM', event);
            this.refreshKeywords();

            // schedule a debounce again!
            this.debounce(2000);
        },

        /**
         * Refreshes suggested keywords
         */
        refreshKeywords(): void {
            // We don't need to wait for the keywords to load. This way the patent search can be triggered sooner
            this.keywordService.getSuggestions(this.terms).then((suggestions) => {
                this.$store.commit('ADD_SUGGESTIONS', suggestions);
            });
        },

        /**
         * Refreshes patent results
         */
        async refreshResults(): Promise<void> {
            // start showing the smaller loading indicator
            this.$store.commit('SHOW_LOADING_BAR');

            // add search terms to the url so that it is shareable
            await this.$router.push({ query: { terms: this.terms } });

            try {
                // in order to have a more consistent experience the loading screen should appear at least 1s
                const [result] = await Promise.all([
                    this.patentService.query(this.terms, this.filters),
                    this.defaultLoadingTime(),
                ]);

                const { patents, totalCount } = result;

                // add the patents to the store
                this.$store.dispatch('addPatents', { patents, totalCount });
                // eslint-disable-next-line
            } catch (e: any) {
                // show an error message based on the error type
                e.message === 'Not Found.'
                    ? this.$store.commit('SHOW_NORESULT_TOAST')
                    : this.$store.commit('SHOW_ERROR_TOAST');

                // reset all result dependent variables
                this.reset();
            }

            // hide loading indicators
            this.$store.commit('HIDE_LOADING_SCREEN');
            this.$store.commit('HIDE_LOADING_BAR');

            // now we can check the result
            this.checkResult();
        },

        /**
         * Extend the search with a new page (99 more results)
         */
        async extendSearch() {
            this.$store.commit('SHOW_LOADING_BAR');

            // increment the page
            const newPage = this.currentPage + 1;

            const { patents, totalCount } = await this.patentService.query(this.terms, this.filters, newPage);

            // add patents and incremented page to store
            this.$store.dispatch('addPatents', {
                patents: this.patents.concat(patents),
                totalCount,
                page: newPage,
            });

            // check results
            this.checkResult();

            // hide loading indicator
            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Event handler which sets a node as selected
         *
         * @param e The event containing the selected node
         */
        onNodeSelected(e: { node: NodeInfo }) {
            this.citationSelected = false;
            this.selectedNode = e.node;

            if (e.node.type === 'citation') {
                this.citationSelected = true;
                this.loadCitation(e.node);
            }
        },

        /**
         * Event handler which deselects the current node variables
         */
        onClearNodeSelected() {
            this.selectedNode = null;
            this.citationSelected = false;
        },

        /**
         * Handle the navigation back and forward for patent preview
         */
        onChangeNode(e: { direction: string }, collection: string[], type: NodeType): void {
            // get the index of the current node
            let selectedIndex = collection.findIndex((t) => t === this.selectedNode?.id);

            // increment or decrement the index based on the direction. Also handle edge cases
            switch (e.direction) {
                case 'next':
                    selectedIndex = (selectedIndex + 1) % collection.length;
                    break;
                case 'previous':
                    selectedIndex = selectedIndex - 1;
                    selectedIndex = selectedIndex < 0 ? collection.length - 1 : selectedIndex;
                    break;
            }

            // set the selected node reference to the next node
            this.selectedNode = {
                id: collection[selectedIndex],
                type,
            };

            // highlight the current node
            this.highlightOnPreview();

            // if node type is of kind 'patent' also set the preview marker
            if (this.selectedNode.type === 'patent') {
                this.setMarkOnPreview();
            }
        },

        /**
         * Event handler for selecting a patent
         *
         * @param event The event containing the patent ID of the selected patent
         */
        selectPatent(event: { id: string }) {
            this.citationSelected = false;
            this.selectedNode = { id: event.id, type: 'patent' };
        },

        /**
         * Sets the preview highlight on a node
         */
        highlightOnPreview(): void {
            // reset highlight on node
            this.$store.commit('HIGHLIGHT_NODE_OFF');

            // turn highlight on node on. Timeout so to have the component react to state change
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', {
                    pID: this.selectedNode?.id,
                    nodeType: this.selectedNode?.type,
                });
            });
        },

        /**
         * Sets the checkmark for a previewed patent to 'ON'
         */
        setMarkOnPreview(): void {
            //set mark once on viewed node
            this.$store.commit('ADD_MARK', { pID: this.selectedNode?.id, twice: false });
        },

        /**
         * Event handler which will show the detailed patent view for a selected patent
         * Is called when the user clicks on the show-more button of a patent
         *
         * @param event The event containing the id of the selected patent and the current searchTerms
         */
        onShowMore(event: { id: string; searchTerms: string[] }) {
            let patent = this.patents.find((t) => t.id === event.id);

            // for citation nodes the patent data might be available in the stores
            if (!patent) {
                patent = this.$store.state.extendedPatents[event.id].patent;
            }

            // remove highlight from the node and show the blur-mask
            this.$store.commit('HIGHLIGHT_NODE_OFF');
            this.$store.commit('SHOW_DIALOG_MASK');

            // set correct detailed patent reference for the DetailedView to show up
            this.detailedPatent = { patent, searchTerms: event.searchTerms } as ExtendedPatent;

            //set mark twice on viewed node
            this.$store.commit('ADD_MARK', { pID: this.detailedPatent?.patent.id, twice: true });

            // highlight node
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', { pID: this.detailedPatent?.patent.id, nodeType: 'patent' });
            });
        },

        /**
         * Resets all variables used for the visualization (patents, selectedNodes, ...) and shows
         * a no-results message to the user
         */
        reset(): void {
            this.$store.dispatch('addPatents', { patents: [] as Patent[], totalCount: 0 });
            this.selectedNode = null;
            this.resetWaiting = true;

            this.resetHandler = setTimeout(async () => {
                this.$store.commit('HIDE_NORESULT_TOAST');
                this.resetWaiting = false;
            }, 6000);
        },

        /**
         * Cancels going back to the landing page.
         */
        cancelReset(): void {
            if (this.resetHandler == null) {
                return;
            }
            clearTimeout(this.resetHandler);
            this.resetWaiting = false;
            this.$store.commit('HIDE_NORESULT_TOAST');
        },

        /**
         * Checks the current URL for query parameters and commits them to the store
         * in order to reflect the changes throughout the app
         */
        checkUrl(): void {
            // If only one query parameter is sent it's treated as a string, not an array
            let queryParams = this.$route.query.terms as string | string[];
            if (typeof queryParams === 'string') {
                queryParams = [queryParams];
            }

            this.$store.commit('SET_SEARCH_TERMS', queryParams);
        },

        /**
         * Checks if there needs to be any additional actions done for the result
         */
        checkResult(): void {
            // set more data available value to true or false depending on the left pages (after page 18 OPS will throw an error)
            this.moreDataAvailable =
                this.totalCount > 99 && this.currentPage < this.availablePages - 1 && this.currentPage <= 18;
        },

        /**
         * Event handler which opens the saved page
         */
        openSavePage(): void {
            this.$router.push({ path: '/saved' });
        },

        /**
         * Event handler which adds a patent to the saved list
         * @param event The event containing the patent which should be saved
         */
        onSavePatent(event: { id: string }): void {
            // get the full patent and save it to the store.
            const patent = this.patents.find((t) => t.id === event.id);
            this.$store.commit('ADD_SAVED_PATENT', { patent, searchTerms: this.terms });

            // reset the selected reference to hide the preview
            this.selectedNode = null;
        },

        /**
         * Returns a promise that should be fulfilled after 1s
         */
        async defaultLoadingTime() {
            return new Promise((res) => {
                setTimeout(() => res(1), 1000);
            });
        },

        /**
         * Event handler which saves a patent to the store
         * @param event The event containing the extended patent
         */
        onSavePatentDetailed(event: { patent: ExtendedPatent }): void {
            this.$store.commit('ADD_SAVED_PATENT', {
                patent: event.patent.patent,
                searchTerms: event.patent.searchTerms,
            });
        },

        /**
         * Loads a citation and sets the current citation reference to it
         * @param node  The node containing the id of the patent
         */
        async loadCitation(node: { id: string }) {
            this.currentCitation = null;
            try {
                const patent = await this.patentService.get(node.id);

                this.$store.commit('STORE_PATENT', { patent, terms: [] });
                this.currentCitation = PreviewHelperService.getPatentPreview(patent, this.$store.state.savedPatents);
            } catch (err) {
                this.currentCitation = null;
                this.citationSelected = false;
                throw err;
            }
        },
    },
});
</script>

<style lang="scss" scoped>
.top-left-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: absolute;
    top: 0;
    pointer-events: none;

    div {
        pointer-events: all !important;
    }
}
.search-input {
    width: 600px;
}
.options-menu {
    width: 20%;
    height: 15vh;
    margin: 10px;
}
.table {
    border: 1px solid black;
    width: 100%;
    margin-bottom: -48px;
}
.thead-dark {
    border: 1px solid black;
    width: 100%;
}

.search-input {
    width: 600px;
}

.result-wrapper {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    svg {
        width: 100vw;
        height: 100vh;
    }
}

.search-result {
    max-width: 90%;
    display: flex;
    flex-direction: row;
    gap: 10px;
    flex-wrap: wrap;
    overflow: scroll;
    margin-top: 25vh;
    justify-content: flex-start;
    align-items: center;
    width: 100vw;
}

.search-table {
    width: 80vw;
    border: none;
}

.bottom-controls {
    padding: 20px;
    position: absolute;
    bottom: 0;
    right: 0;
    gap: 20px;
    display: flex;
}

.top-controls {
    margin: 20px;
    position: absolute;
    top: 0;
    right: 0;
}

.patent-preview {
    position: absolute;
    z-index: 100;
    bottom: 0;
    left: 0;
}
</style>
