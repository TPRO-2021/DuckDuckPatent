<template>
    <div class="container logo-container">
        <Logo class="logo" />
    </div>
    <div class="container searchbar-container">
        <Searchbar
            v-on:on-add-keyword="onAddKeyword($event)"
            v-on:on-remove-keyword="onRemoveKeyword($event)"
            :search-terms="$store.state.searchTerms"
            v-on:on-search="onSearch"
        />

        <KeywordSuggestions
            :provided-keywords="$store.state.suggestedTerms"
            v-on:on-add-keyword="onAddKeyword"
        ></KeywordSuggestions>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import KeywordService from '@/services/keyword.service';
import Searchbar from '@/components/Searchbar.vue';
import Logo from '@/components/Logo.vue';
import KeywordSuggestions from '@/components/KeywordSuggestions.vue';

export default defineComponent({
    name: 'Search',
    components: {
        Searchbar,
        Logo,
        KeywordSuggestions,
    },
    data() {
        return {
            keywordService: new KeywordService(),
        };
    },
    methods: {
        /**
         * Update the array from store on inserting keyword and the suggestion terms
         * $store is the global variable that have access to the all containers
         * @param event - represent the inserted keyword either from suggestion list or typed word
         */
        async onAddKeyword(event: { value: string }) {
            this.$store.commit('ADD_SEARCH_TERM', event.value);

            const newSuggestions = await this.keywordService.getSuggestions(this.$store.state.searchTerms);
            this.$store.commit('ADD_SUGGESTIONS', newSuggestions);
        },
        /**
         * Update the search and the suggestion terms arrays  from store
         * @param event the remove keyword from the search input
         */
        async onRemoveKeyword(event: { index: number; value: string }) {
            this.$store.commit('REMOVE_SEARCH_TERM', event);

            const newSuggestions = await this.keywordService.getSuggestions(this.$store.state.searchTerms);
            this.$store.commit('ADD_SUGGESTIONS', newSuggestions);
        },

        onSearch() {
            this.$router.push({ path: 'search', query: { terms: this.$store.state.searchTerms } });
        },
    },
});
</script>

<style lang="scss" scoped>
.container {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.logo-container {
    pointer-events: none;
    position: absolute;

    .logo {
        padding-bottom: 150px;
    }
}

.searchbar-container {
    height: 50vh;
    transform: translateY(-50px);
    position: absolute;
    justify-content: flex-start;
    bottom: 0;

    div {
        width: 600px;
    }
}
</style>
