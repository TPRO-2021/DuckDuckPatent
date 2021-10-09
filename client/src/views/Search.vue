<template>
    <div class="container logo-container">
        <Logo class="logo" />
    </div>
    <div class="container searchbar-container">
        <Searchbar
            v-on:on-add-keyword="onAddKeyword($event)"
            v-on:on-remove-keyword="onRemoveKeyword"
            :search-terms="searchTerms"
        />

        <KeywordSuggestions :provided-keywords="suggestedTerms" v-on:on-add-keyword="onAddKeyword"></KeywordSuggestions>

        {{ searchTerms }}
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
            searchTerms: [] as string[],
            suggestedTerms: [] as string[],
            keywordService: new KeywordService(),
        };
    },
    methods: {
        async onAddKeyword(event: { value: string }) {
            this.searchTerms.push(event.value);
            this.suggestedTerms = await this.keywordService.getSuggestions(this.searchTerms);
        },

        async onRemoveKeyword() {
            this.suggestedTerms = await this.keywordService.getSuggestions(this.searchTerms);
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
    justify-content: start;
    bottom: 0;

    div {
        width: 600px;
    }
}
</style>
