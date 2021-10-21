<template>
    <div class="search-wrapper box-shadow" @click="setFocus">
        <div class="search-input" ref="searchInput">
            <div class="keywords" ref="keywordDiv">
                <Chip
                    v-for="(keyword, index) in searchTerms"
                    icon-key="cancel"
                    :text="keyword"
                    :key="keyword"
                    v-on:on-select="removeKeyword(index)"
                    :has-shadow="false"
                ></Chip>
            </div>
            <input
                id="search"
                ref="searchBar"
                placeholder="Enter keywords"
                v-model="currentKeyword"
                @focusin="$emit('inputFocused')"
                @focusout="$emit('inputNotFocused')"
                @keyup.enter="initializeSearch"
                @keydown.tab="addKeyword"
                @keydown.delete="handleDeleteKey"
            />
        </div>
        <button type="button" id="search-btn" @click="initializeSearch">
            <span class="material-icons search-icon">search</span>
        </button>
    </div>
</template>

<script lang="ts">
import Chip from '@/components/Chip.vue';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'Searchbar',
    components: {
        Chip,
    },
    props: {
        searchTerms: Array,
    },
    emits: {
        onAddKeyword: (event: { value: string }) => {
            return event;
        },
        onRemoveKeyword: (event: { index: number; value: string }) => {
            return event;
        },
        onSearch: (event: { searchTerms: string[] }) => {
            return event;
        },
        inputFocused: (event: unknown) => {
            return event;
        },
        inputNotFocused: (event: unknown) => {
            return event;
        },
    },
    data() {
        return {
            currentKeyword: '',
            clicked: false,
        };
    },
    watch: {
        /**
         * Watcher which checks the current search input for a space bar input
         * @param val
         */
        currentKeyword(val: string): void {
            if (!val || val.charAt(val.length - 1) !== ' ') {
                return;
            }

            this.addKeyword();
        },
    },
    methods: {
        /**
         * Adds a keyword to the keywords array and resets the v-model value of currentKeyword
         */
        addKeyword() {
            if (this.currentKeyword.length === 0) {
                return;
            }

            if (this.currentKeyword.trim().length === 0) {
                this.currentKeyword = '';
                return;
            }

            const newKeyword = this.currentKeyword.trim();
            // this.$props.enteredKeywords.push(newKeyword);
            this.$emit('onAddKeyword', { value: newKeyword });
            this.currentKeyword = '';

            this.setFocus();
        },

        /**
         * Removes an item from the enteredKeywords array specified by the index
         * @param index
         */
        removeKeyword(index: number): string {
            const value = (this.$props.searchTerms || [])[index] as string;
            this.$emit('onRemoveKeyword', { index, value });
            return value;
        },

        /**
         * Attempts to set the focus back on the searchBar
         */
        setFocus(): void {
            (this.$refs.searchBar as HTMLInputElement)?.focus();
        },

        /**
         * Handler for the back-key
         */
        handleDeleteKey(): void {
            if ((this.searchTerms as string[]).length < 1 || (this.currentKeyword as string).length > 0) {
                return;
            }

            const keyword = this.removeKeyword((this.searchTerms as string[]).length - 1);
            setTimeout(() => (this.currentKeyword = keyword), 20);
        },

        /**
         * Handler for the enter key and search icon press
         */
        initializeSearch(): void {
            if (this.currentKeyword.trim().length > 0) {
                this.addKeyword();
            }

            // if no search terms are specified we need to prevent the state change.
            if (!this.searchTerms || this.searchTerms.length === 0 || this.$route.path === '/search') {
                return;
            }

            this.$emit('onSearch', { searchTerms: this.searchTerms as string[] | [] });
        },
    },
});
</script>

<style lang="scss" scoped>
.search-wrapper {
    width: 100%;
    height: auto;
    border-radius: 25px;
    display: flex;
    justify-content: space-between;
}

.search-wrapper:hover,
.search-wrapper:focus {
    background: #efefef;
}

.keywords {
    padding: 8px 8px;
    padding-right: 0 !important;
    align-self: center;
    max-width: 500px;
    overflow-wrap: break-word;
    .chip {
        float: left;
    }
}

#search {
    background: none;
    flex-grow: 1;
    height: 50px;
    border: none;
    padding-left: 16px;
    outline: none;
    font-size: 14px;
    align-self: center;

    // remove default input style
    -moz-appearance: none;
    appearance: none;
    -webkit-appearance: none;
}

/* Style the submit button */
#search-btn {
    outline: none;
    position: relative;
    right: 20px;
    width: 30px;
    height: 100%;
    padding: 10px;
    background: none;
    color: black;
    cursor: pointer;
    border-bottom-right-radius: 25px;
    border-top-right-radius: 25px;
    z-index: 10;
}

.search-icon {
    font-size: 30px !important;
}

.search-input {
    display: flex;
    flex-wrap: wrap;
}
</style>
