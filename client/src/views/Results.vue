<template>
    <div class="container">
        <!-- This div contains searchbar and options menu -->
        <div class="top-left-controls">
            <!-- This div contains the searchbar and keyword suggestions -->
            <div class="search-input card box-shadow">
                <Searchbar
                    :search-terms="terms"
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
                <OptionsMenu />
            </div>
        </div>
        <div class="result-wrapper">
            <ResultsVisualization :patents="patents" />
        </div>
        <!-- This div contains the bottom controls (timeline toggle, mode-toggle) -->
        <div class="bottom-controls">
            <RoundButton icon-key="timeline" :is-toggle="true" v-on:on-clicked="toggleTimeline" />
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

export default defineComponent({
    name: 'Results',
    components: {
        Searchbar,
        KeywordSuggestions,
        RoundButton,
        OptionsMenu,
        ResultsVisualization,
    },
    data() {
        return {
            patentService: new PatentService(),
            keywordService: new KeywordService(),
            showTimeline: false,
        };
    },
    /**
     * Computed property that helps avoiding the continous reference the global store:searchTerms, suggestedTerms
     * and patents from store/index.ts
     */
    computed: {
        terms(): string[] {
            return this.$store.state.searchTerms;
        },
        suggestedTerms(): string[] {
            return this.$store.state.suggestedTerms;
        },
        patents(): Patent[] {
            return this.$store.state.patents;
        },
    },
    async created() {
        // if no search-term is present change back to the search page!
        if (this.terms.length === 0) {
            await this.$router.push({ path: '/' });
        }
        /**
         * Update the keyword suggestion from store by retrieving from database API after a keyword was inserted
         */
        // We don't need to wait for the keywords to load. This way the patent search can be triggered sooner
        this.keywordService.getSuggestions(this.terms).then((res) => {
            this.$store.commit('ADD_SUGGESTIONS', res);
        });

        const patents = await this.patentService.get(this.terms);
        this.$store.commit('ADD_PATENTS', patents);
    },
    methods: {
        /**
         * Adds a keyword to the current search terms and triggers a result refresh
         *
         * @param event The event containing the passed up keyword
         */
        async onAddKeyword(event: { value: string }): Promise<void> {
            this.$store.commit('ADD_SEARCH_TERM', event.value);
            await this.refreshResults();
        },

        /**
         * Removes a keyword from the current search terms and triggers a result refresh
         *
         * @param event
         */
        async onRemoveKeyword(event: { value: string; index: number }) {
            this.$store.commit('REMOVE_SEARCH_TERM', event);
            await this.refreshResults();
        },

        /**
         * Refreshes suggested keywords and patent results
         */
        async refreshResults(): Promise<void> {
            // We don't need to wait for the keywords to load. This way the patent search can be triggered sooner
            this.keywordService.getSuggestions(this.terms).then((suggestions) => {
                this.$store.commit('ADD_SUGGESTIONS', suggestions);
            });

            await this.$router.push({ query: { terms: this.terms } });

            const patents = await this.patentService.get(this.terms);
            this.$store.commit('ADD_PATENTS', patents);
        },

        /**
         * Toggles the visibility of the timeline
         * @param $event
         */
        toggleTimeline($event: boolean): void {
            this.showTimeline = $event;
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
    padding: 10px;
    position: absolute;
    bottom: 0;
    right: 0;
}
</style>
