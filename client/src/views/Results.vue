<template>
    <div class="container">
        <!-- This div contains searchbar and options menu -->
        <div class="top-left-controls">
            <!-- This div contains the searchbar and keyword suggestions -->
            <div class="search-input card box-shadow">
                <Searchbar :search-terms="terms"
                           v-on:on-add-keyword="onAddKeyword"
                           v-on:on-search="refreshResults"
                           v-on:on-remove-keyword="onRemoveKeyword">
                </Searchbar>
                <KeywordSuggestions :provided-keywords="suggestedTerms"
                                    v-on:on-add-keyword="onAddKeyword"></KeywordSuggestions>
            </div>
            <!-- This div contains the options menu for user to add more nodes/filters -->
            <div class="options-menu">
                <OptionsMenu />
            </div>
        </div>
        <div class="result-wrapper">
            <ResultsVisualization :patents="patents"
                                  v-on:on-patent-selected="onPatentSelected" />
        </div>
        <!-- This div contains the bottom controls (timeline toggle, mode-toggle) -->
        <div class="bottom-controls">
            <RoundButton icon-key="timeline" :is-toggle="true" v-on:on-clicked="toggleTimeline" />
        </div>
        <div class="patent-preview">
            <PatentPreview :patent="patents[selectedPatentIndex]" />
        </div>


    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PatentService from '@/services/patent.service';
import { Patent } from '@/models/Patent';
import Searchbar from '@/components/Searchbar.vue';
import PatentPreview from '@/components/PatentPreview.vue';
import KeywordSuggestions from '@/components/KeywordSuggestions.vue';
import KeywordService from '@/services/keyword.service';
import RoundButton from '@/components/RoundButton.vue';
import OptionsMenu from '@/components/OptionsMenu.vue';
import ResultsVisualization from '@/components/ResultVisualization.vue';

export default defineComponent({
    name: 'Results',
    components: {
        Searchbar,
        PatentPreview,
        KeywordSuggestions,
        RoundButton,
        OptionsMenu,
        ResultsVisualization,
        
    },
    data() {
        return {
            patents: [] as Patent[],
            terms: [] as string[],
            suggestedTerms: [] as string[],
            patentService: new PatentService(),
            keywordService: new KeywordService(),
            showTimeline: false,
            selectedPatentIndex: 0,
        };
    },
    async created() {
        // If only one query parameter is sent it's treated as a string, not an array
        let queryParams = this.$route.query.terms as string | string[];

        if (typeof queryParams === 'string') {
            queryParams = [queryParams];
        }

        this.terms = queryParams || [];

        // if no search-term is present change back to the search page!
        if (this.terms.length === 0) {
            await this.$router.push({ path: '/' });
        }

        // We don't need to wait for the keywords to load. This way the patent search can be triggered sooner
        this.keywordService.getSuggestions(this.terms).then((res) => {
            this.suggestedTerms = res;
        });
        this.patents = await this.patentService.get(this.terms);
        console.log("firstPatent",this.patents[0]);
    },
    methods: {
        /**
         * Adds a keyword to the current search terms and triggers a result refresh
         *
         * @param event The event containing the passed up keyword
         */
        async onAddKeyword(event: { value: string }): Promise<void> {
            // It can be important not to mutate state because it can cause unintended side-effects
            // Adding to an array using the spread operator [...] or concat() makes the code easier to reason
            // about because it can't change values outside of this code's scope.
            // More information on this general concept: https://www.geeksforgeeks.org/why-is-immutability-so-important-in-javascript/
            this.terms = [...this.terms, event.value];
            await this.refreshResults();
        },

        /**
         * Removes a keyword from the current search terms and triggers a result refresh
         *
         * @param event
         */
        async onRemoveKeyword(event: { value: string; index: number }) {
            // It can be important not to mutate state because it can cause unintended side-effects
            // Removing from an array using filter() makes the code easier to reason
            // because it can't change values outside of this code's scope.
            // More information on this general concept: https://www.geeksforgeeks.org/why-is-immutability-so-important-in-javascript/
            this.terms = this.terms.filter((t, index) => event.index !== index);
            await this.refreshResults();
        },

        /**
         * Refreshes suggested keywords and patent results
         */
        async refreshResults(): Promise<void> {
            // We don't need to wait for the keywords to load. This way the patent search can be triggered sooner
            this.keywordService.getSuggestions(this.terms).then((suggestions) => {
                this.suggestedTerms = suggestions;
            });

            await this.$router.push({ query: { terms: this.terms } });
            this.patents = await this.patentService.get(this.terms);
        },
        onPatentSelected(e: { patent: Patent, index: number }) {
            this.selectedPatentIndex = e.index;
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
.patent-preview {
        position: absolute;
        z-index: 100;
        bottom: 0;
        left: 0;
}
</style>
