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
                    v-on:add-node="$store.commit('addVisualizationOption', $event)"
                    v-on:remove-node="$store.commit('removeVisualizationOption', $event)"
                />
            </div>
        </div>
        <div class="result-wrapper">
            <ResultsVisualization :visualization-options="visualizationOptions" :patents="patents" />
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

        <div class="top-controls">
            <Button btnText="Saved" iconKey="turned_in" badge-value="21" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PatentService from '@/services/patent.service';
import { Patent } from '@/models/Patent';
import Searchbar from '@/components/Searchbar.vue';
import KeywordSuggestions from '@/components/KeywordSuggestions.vue';
import KeywordService from '@/services/keyword.service';
import RoundButton from '@/components/RoundButton.vue';
import OptionsMenu from '@/components/OptionsMenu.vue';
import ResultsVisualization from '@/components/ResultVisualization.vue';
import Button from '@/components/Button.vue';

export default defineComponent({
    name: 'Results',
    components: {
        Searchbar,
        KeywordSuggestions,
        RoundButton,
        OptionsMenu,
        ResultsVisualization,
        Button,
    },
    data() {
        return {
            debounceHandler: null as number | null,
            patentService: new PatentService(),
            keywordService: new KeywordService(),
            showTimeline: false,
            inputFieldWaiting: false,
            moreDataAvailable: false,
        };
    },
    /**
     * Computed property that helps avoiding the continuous reference the global store:searchTerms, suggestedTerms
     * and patents from store/index.ts
     */
    computed: {
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
    },
    async created() {
        this.$store.commit('showLoadingScreen');

        // since the store is not preserved in a refresh we need to check the current URL for keywords
        this.checkUrl();

        // if no search-term is present change back to the search page!
        if (this.terms.length === 0) {
            await this.$router.push({ path: '/' });
        }

        // We don't need to wait for the keywords to load. This way the patent search can be triggered sooner
        this.keywordService.getSuggestions(this.terms).then((res) => {
            this.$store.commit('ADD_SUGGESTIONS', res);
        });

        const { patents, totalCount } = await this.patentService.get(this.terms);
        this.$store.dispatch('addPatents', { patents, totalCount });

        // after loading the patents the loading screen should disappear
        this.$store.commit('hideLoadingScreen');

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
            }, debounceTime);
        },
        /**
         * Adds a keyword to the current search terms and triggers a result refresh + debouncing the request
         *
         * @param event The event containing the passed up keyword
         */
        async onAddKeyword(event: { value: string }): Promise<void> {
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

            if (this.terms.length === 0) {
                await this.$router.push({ path: '/' });
                return;
            }

            await this.$router.push({ query: { terms: this.terms } });

            const { patents, totalCount } = await this.patentService.get(this.terms);
            this.$store.dispatch('addPatents', { patents, totalCount });

            // finally hide loading indicator
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
            const { patents, totalCount } = await this.patentService.get(this.terms, newPage);
            this.$store.dispatch('addPatents', { patents: this.patents.concat(patents), totalCount, page: newPage });

            this.checkResult();
            this.$store.commit('HIDE_LOADING_BAR');
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
    width: 800px;
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
</style>
