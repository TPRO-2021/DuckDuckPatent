<template>
    <div class="search-wrapper" @click="setFocus">
        <div class="search-input" ref="searchInput">
            <div class="keywords" ref="keywordDiv">
                <Chip
                    v-for="(keyword, index) in enteredKeywords"
                    icon-key="cancel"
                    :text="keyword"
                    :key="keyword"
                    v-on:on-select="removeKeyword(index)"
                ></Chip>
            </div>
            <input
                id="search"
                ref="searchBar"
                placeholder="Enter keywords"
                v-model="currentKeyword"
                @keyup.enter="clicked = true"
                @keydown.tab="addKeyword"
                @keydown.delete="handleDeleteKey"
            />
        </div>
        <button type="button" id="search-btn" @click="clicked = true">
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
    data() {
        return {
            currentKeyword: '',
            enteredKeywords: [] as string[],
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

            this.enteredKeywords.push(this.currentKeyword.trim());
            this.currentKeyword = '';

            this.setFocus();
            setTimeout(this.checkSearchBarSize, 20);
        },

        /**
         * Removes an item from the enteredKeywords array specified by the index
         * @param index
         */
        removeKeyword(index: number): string {
            const returnItem = this.enteredKeywords.splice(index, 1)[0];

            this.checkSearchBarSize(true);
            return returnItem;
        },

        /**
         * Attempts to set the focus back on the searchBar
         */
        setFocus(): void {
            (this.$refs.searchBar as HTMLInputElement).focus();
        },

        /**
         * Checks the size of the keyword-div in order to move the input to the next line
         * @private
         */
        checkSearchBarSize(deleteAction = false): void {
            if ((this.$refs.keywordDiv as HTMLElement).clientWidth <= 320) {
                if (!deleteAction) {
                    return;
                }

                (this.$refs.searchInput as HTMLElement).style.paddingTop = 'unset';
                (this.$refs.searchInput as HTMLElement).style.flexDirection = 'row';
                (this.$refs.searchInput as HTMLElement).style.paddingLeft = 'unset';
                (this.$refs.searchBar as HTMLElement).style.alignSelf = 'center;';
                return;
            }

            (this.$refs.searchInput as HTMLElement).style.paddingTop = '10px';
            (this.$refs.searchInput as HTMLElement).style.flexDirection = 'column';
            (this.$refs.searchInput as HTMLElement).style.paddingLeft = '10px';
            (this.$refs.searchBar as HTMLElement).style.alignSelf = 'unset';
        },

        /**
         * Handler for the back-key
         */
        handleDeleteKey(): void {
            if (this.enteredKeywords.length < 1 || this.currentKeyword.length > 0) {
                return;
            }

            const keyword = this.removeKeyword(this.enteredKeywords.length - 1);
            setTimeout(() => (this.currentKeyword = keyword), 20);
        },
    },
});
</script>

<style lang="scss" scoped>
.search-wrapper {
    width: 100%;
    height: auto;
    border: 0.5px solid #cccccc;
    border-radius: 25px;
    display: flex;
    justify-content: space-between;
    box-shadow: 3px 4px 10px rgba(0, 0, 0, 0.25);
}

.search-wrapper:hover,
.search-wrapper:focus {
    background: #efefef;
}

.keywords {
    padding: 0 5px;
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
    padding-inline-start: 10px;
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
