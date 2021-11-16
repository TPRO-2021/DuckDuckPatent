<template>
    <div class="container logo-container no-select">
        <Logo class="logo" />
    </div>
    <div class="container searchbar-container no-select">
        <Searchbar
            v-on:on-add-keyword="onAddKeyword($event)"
            v-on:on-remove-keyword="onRemoveKeyword($event)"
            :search-terms="searchTerms"
            v-on:on-search="onSearch"
        />

        <KeywordSuggestions :provided-keywords="suggestedTerms" v-on:on-add-keyword="onAddKeyword"></KeywordSuggestions>
    </div>
    <div class="about-section">
        <a class="gh-logo" href="https://github.com/TPRO-2021/DuckDuckPatent" target="_blank"
            ><img src="../assets/github-icon.png" alt="Github"
        /></a>
        <div class="separator">|</div>
        <a class="about-link" href="/about">About</a>
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
    created(): void {
        this.$store.commit('HIDE_LOADING_BAR');
        this.$store.dispatch('resetSavedState');

        // adds the loading screen for 0.5s
        this.$store.commit('SHOW_LOADING_SCREEN');
        setTimeout(() => {
            this.$store.commit('HIDE_LOADING_SCREEN');
        }, 800);
    },
    computed: {
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        suggestedTerms(): string[] {
            return this.$store.state.suggestedTerms;
        },
    },
    methods: {
        /**
         * Update the array from store on inserting keyword and the suggestion terms
         * $store is the global variable that have access to the all containers
         * @param event - represent the inserted keyword either from suggestion list or typed word
         */
        async onAddKeyword(event: { value: string }) {
            this.$store.commit('ADD_SEARCH_TERM', event.value);
            this.$store.commit('SHOW_LOADING_BAR');

            try {
                const newSuggestions = await this.keywordService.getSuggestions(this.searchTerms);
                this.$store.commit('ADD_SUGGESTIONS', newSuggestions);
            } catch (err) {
                console.log(err);
            } finally {
                this.$store.commit('HIDE_LOADING_BAR');
            }
        },
        /**
         * Update the search and the suggestion terms arrays  from store
         * @param event the remove keyword from the search input
         */
        async onRemoveKeyword(event: { index: number; value: string }) {
            this.$store.commit('REMOVE_SEARCH_TERM', event);
            this.$store.commit('SHOW_LOADING_BAR');

            const newSuggestions = await this.keywordService.getSuggestions(this.searchTerms);
            this.$store.commit('ADD_SUGGESTIONS', newSuggestions);

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * On search handler which triggers the search for patents with the current keywords
         */
        onSearch() {
            this.$store.commit('SHOW_LOADING_SCREEN');
            this.$router.push({ path: 'search', query: { terms: this.searchTerms } });
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
    overflow: hidden;
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

    padding: 20px;

    div {
        max-width: 600px;
    }
}

.about-section {
    position: absolute;
    bottom: 0;
    display: flex;
    width: 100vw;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 20px;
}

.gh-logo {
    height: 1.6rem;
    margin: 0.5rem;
    img {
        height: 100%;
    }
}

.about-link {
    text-decoration: none;
    color: unset;
}

.gh-logo,
.separator,
.about-link {
    opacity: 50%;
}

.gh-logo:hover,
.about-link:hover {
    opacity: 100%;
    transition: all 1s ease;
    cursor: pointer;
}

.separator,
.about-link {
    margin: 0.5rem;
    font-size: 1.1rem;
}

@media screen and (max-width: 650px) {
    .searchbar-container {
        transform: translateY(-0px);
    }
}
</style>
