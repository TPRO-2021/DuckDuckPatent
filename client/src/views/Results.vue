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
        <div class="result-wrapper">
            <ResultsVisualization
                :visualization-options="visualizationOptions"
                :patents="patents"
                v-on:on-patent-selected="onPatentSelected"
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
            <RoundButton icon-key="timeline" :is-toggle="true" v-on:on-clicked="toggleTimeline" />
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

        <div class="patent-preview" v-if="selectedPatentIndex > -1">
            <PatentPreview
                :patent="patents[selectedPatentIndex]"
                v-on:on-change-patent="onChangePatent($event)"
                v-on:on-save-patent="onSavePatent($event)"
                v-on:on-show-more="onShowMore($event)"
            />
        </div>
        <DetailedPatentView :extended-patent="detailedPatent" v-on:on-close="detailedPatent = null" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PatentService from '@/services/patent.service';
import { Patent } from '@/models/Patent';
import { Filter } from '@/models/Filter';
import Searchbar from '@/components/Searchbar.vue';
import PatentPreview from '@/components/PatentPreview.vue';
import KeywordSuggestions from '@/components/KeywordSuggestions.vue';
import KeywordService from '@/services/keyword.service';
import RoundButton from '@/components/RoundButton.vue';
import OptionsMenu from '@/components/OptionsMenu.vue';
import ResultsVisualization from '@/components/ResultVisualization.vue';
import Button from '@/components/Button.vue';
import DetailedPatentView from '@/components/DetailedPatentView.vue';
import { ExtendedPatent } from '@/models/ExtendedPatent';

export default defineComponent({
    name: 'Results',
    components: {
        Searchbar,
        PatentPreview,
        KeywordSuggestions,
        RoundButton,
        OptionsMenu,
        ResultsVisualization,
        Button,
        DetailedPatentView,
    },
    data() {
        return {
            debounceHandler: null as number | null,
            resetHandler: null as number | null,
            resetWaiting: false,
            patentService: new PatentService(),
            keywordService: new KeywordService(),
            showTimeline: false,
            selectedPatentIndex: -1,
            inputFieldWaiting: false,
            moreDataAvailable: false,
            lastFilterString: '',
            detailedPatent: null as ExtendedPatent | null,
        };
    },
    watch: {
        filters(filters: Filter[]): void {
            // On every change of the filters we need to check if we should update the results
            // Creata a filter string that we can compare to recently sent ones (this could be refactored)
            const newFilterString = filters
                .filter((filter) => filter.type !== 'empty' && filter.value) // Remove empty or malformed filters
                .map((filter) => `${filter.type}=${filter.value}`)
                .join('&'); // Convert to "key=value&key2=value2" string

            // Compare the string with the last sent, if they're different, refresh the results
            if (newFilterString !== this.lastFilterString) {
                this.lastFilterString = newFilterString; // Update the last observered filter string for next time
                this.debounce(4000); // Refresh the results after 3 seconds
            }
        },
    },
    /**
     * Computed property that helps avoiding the continuous reference the global store:searchTerms, suggestedTerms
     * and patents from store/index.ts
     */
    computed: {
        filters(): Filter[] {
            return this.$store.state.filters;
        },
        visualizationOptions(): string[] {
            return this.$store.state.visualizationOptions;
        },
        terms(): string[] {
            return this.$store.state.searchTerms;
        },
        suggestedTerms(): string[] {
            return this.$store.state.suggestedTerms;
        },
        patents(): Patent[] {
            return this.$store.state.patents;
        },
        totalCount(): number {
            return this.$store.state.totalCount;
        },
        availablePages(): number {
            return this.totalCount / 99;
        },
        currentPage(): number {
            return this.$store.state.pageCount;
        },
        savedPatentsCount(): string {
            if (Object.keys(this.$store.state.savedPatents).length === 0) {
                return '';
            }

            return Object.keys(this.$store.state.savedPatents).length.toString();
        },
    },
    async created() {
        this.$store.commit('showLoadingScreen');

        // since the store is not preserved in a refresh we need to check the current URL for keywords
        this.checkUrl();

        // if no search-term is present change back to the search page!
        if (this.terms.length === 0) {
            await this.$router.push({ path: '/' });
        }

        // refresh results
        this.refreshKeywords();
        await this.refreshResults();

        // now we can check the result
        this.checkResult();
    },
    methods: {
        /**
         * Function which delays refreshing the screen for provided time, i.e. debounces client requests.
         * Since the Searchbar.vue is only responsible for converting terms to chips and sending them over,
         * delay of the requests is fully handled here.
         *
         * If input focused, delay increases by half the time. Oftentimes users don't click the icon to initiate search,
         * hence it might be better to simply prolong existing delay to allow for further search inputs.
         *
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
                this.selectedPatentIndex = -1; //to reset the patent preview if it was active before
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
            this.resetWaiting ? this.cancelReset() : '';
            this.$store.commit('REMOVE_SEARCH_TERM', event);
            this.refreshKeywords();
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
            await this.$router.push({ query: { terms: this.terms } });
            try {
                const { patents, totalCount } = await this.patentService.get(this.terms, this.filters);
                this.$store.dispatch('addPatents', { patents, totalCount });
                // eslint-disable-next-line
            } catch (e: any) {
                e.message === 'Not Found.'
                    ? this.$store.commit('SHOW_NORESULT_TOAST')
                    : this.$store.commit('SHOW_ERROR_TOAST');
                this.reset();
            }

            //hideScreen
            this.$store.commit('hideLoadingScreen');
            this.$store.commit('HIDE_LOADING_BAR');

            // now we can check the result
            this.checkResult();
        },

        /**
         * Extend the search with a new page (99 more results)
         */
        async extendSearch() {
            const newPage = this.currentPage + 1;

            this.$store.commit('SHOW_LOADING_BAR');
            const { patents, totalCount } = await this.patentService.get(this.terms, this.filters, newPage);
            this.$store.dispatch('addPatents', { patents: this.patents.concat(patents), totalCount, page: newPage });

            this.checkResult();
            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Event handler which sets the current index to the passed
         * @param e
         */
        onPatentSelected(e: { patent: Patent; index: number }) {
            this.selectedPatentIndex = e.index;
        },

        /**
         * Event handler which processes a change of patent
         * @param e
         */
        onChangePatent(e: { direction: string }): void {
            // reset highlight on node
            this.$store.commit('HIGHLIGHT_NODE_OFF');

            switch (e.direction) {
                case 'next':
                    if (this.selectedPatentIndex >= this.patents.length - 1) {
                        this.selectedPatentIndex = 0;
                        break;
                    }

                    this.selectedPatentIndex++;
                    break;
                case 'previous':
                    if (this.selectedPatentIndex === 0) {
                        this.selectedPatentIndex = this.patents.length - 1;
                        break;
                    }

                    this.selectedPatentIndex--;
                    break;
            }

            // turn highlight on node on. Timeout so to have the component react to state change
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', {
                    index: (this.patents as Patent[])[this.selectedPatentIndex].id,
                    twice: false,
                });
            });
        },
        /**
         * Shows extended patent preview
         *
         */
        onShowMore(event: { patent: Patent; searchTerms: string[] }) {
            //MARK_NODE_VIEWED_OFF
            this.$store.commit('HIGHLIGHT_NODE_OFF');

            this.detailedPatent = event as ExtendedPatent;
            //set mark twice on viewed node
            setTimeout(() => {
                this.$store.commit('HIGHLIGHT_NODE_ON', { index: this.detailedPatent?.patent.id, twice: true });
            });
        },
        /**
         * Resets to landing page after some time, if no results returned. All input is cleared.
         * If user adds/removes keywords, it should cancel going back to the landing page
         *
         */
        reset(): void {
            this.$store.dispatch('addPatents', { patents: [] as Patent[], totalCount: 0 });
            this.selectedPatentIndex = -1;
            this.resetWaiting = true;
            this.resetHandler = setTimeout(async () => {
                this.$store.commit('HIDE_NORESULT_TOAST');
                this.resetWaiting = false;
            }, 6000);
        },
        /**
         * Cancels going back to the landing page.
         *
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
         * Toggles the visibility of the timeline
         * @param $event
         */
        toggleTimeline($event: boolean): void {
            this.showTimeline = $event;
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
         * Checks if there need to be any additional actions done for the result
         */
        checkResult(): void {
            this.moreDataAvailable = this.totalCount > 99 && this.currentPage < this.availablePages;
        },

        /**
         * Opens the saved page
         */
        openSavePage(): void {
            this.$router.push({ path: '/saved' });
        },

        /**
         * Adds a patent to the saved list
         * @param event
         */
        onSavePatent(event: { patent: Patent }): void {
            this.$store.commit('ADD_SAVED_PATENT', { patent: event.patent, searchTerms: this.terms });
            this.selectedPatentIndex = -1;
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
