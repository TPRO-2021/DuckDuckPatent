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
                    v-on:on-remove-keyword="refreshResults"
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
        <div class="search-result">
            <h1>Results</h1>
            <table class="search-table card box-shadow table table-bordered">
                <thead class="thead-dark">
                    <tr>
                        <th scope="col">Title</th>
                        <th scope="col">Date</th>
                        <th scope="col">Abstract</th>
                        <th scope="col">Full Text</th>
                        <th scope="col">Citation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="inff in info" :key="inff.id">
                        <td>{{ inff.title }}</td>
                        <td>{{ inff.date }}</td>
                        <td>{{ inff.abstract }}</td>
                        <td>{{ inff.fulltext }}</td>
                        <td>{{ inff.citations }}</td>
                    </tr>
                </tbody>
            </table>
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


export default defineComponent({
    name: 'Results',
    components: { Searchbar, KeywordSuggestions, RoundButton, OptionsMenu },
    data() {
        return {
            info: [] as Patent[],
            terms: [] as string[],
            suggestedTerms: [] as string[],
            patentService: new PatentService(),
            keywordService: new KeywordService(),
            showTimeline: false,
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

        this.info = await this.patentService.get(this.terms);
        this.suggestedTerms = await this.keywordService.getSuggestions(this.terms);
    },
    methods: {
        async onAddKeyword(event: { value: string }): Promise<void> {
            this.terms.push(event.value);
            this.suggestedTerms = await this.keywordService.getSuggestions(this.terms);
            await this.refreshResults();
        },
        async onRemoveKeyword() {
            await this.refreshResults();
            this.suggestedTerms = await this.keywordService.getSuggestions(this.terms);
        },
        async refreshResults(): Promise<void> {
            this.suggestedTerms = await this.keywordService.getSuggestions(this.terms);
            await this.$router.push({ query: { terms: this.terms } });
            this.info = await this.patentService.get(this.terms);
        },
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
    align-items: start;
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

.search-result {
    display: flex;
    flex-direction: column;
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
