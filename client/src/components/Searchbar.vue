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
import { Vue, Options } from 'vue-class-component';
import { Ref, Watch } from 'vue-property-decorator';
import Chip from '@/components/Chip.vue';

@Options({
    components: {
        Chip,
    },
})
export default class Searchbar extends Vue {
    public currentKeyword = '';
    public enteredKeywords: string[] = [];
    public clicked = false;

    // HTML references
    @Ref() readonly searchBar!: HTMLInputElement;
    @Ref() readonly searchInput!: HTMLElement;
    @Ref() readonly keywordDiv!: HTMLElement;

    /**
     * Watcher which checks the current search input for a space bar input
     * @param val
     */
    @Watch('currentKeyword')
    public checkKeyword(val: string): void {
        if (!val || val.charAt(val.length - 1) !== ' ') {
            return;
        }

        this.addKeyword();
    }

    /**
     * Handler for the back-key
     */
    public handleDeleteKey(): void {
        if (this.enteredKeywords.length < 1 || this.currentKeyword.length > 0) {
            return;
        }

        const keyword = this.removeKeyword(this.enteredKeywords.length - 1);
        setTimeout(() => (this.currentKeyword = keyword), 20);
    }

    /**
     * Adds a keyword to the keywords array and resets the v-model value of currentKeyword
     */
    public addKeyword(): void {
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
    }

    /**
     * Removes an item from the enteredKeywords array specified by the index
     * @param index
     */
    public removeKeyword(index: number): string {
        const returnItem = this.enteredKeywords.splice(index, 1)[0];

        this.checkSearchBarSize(true);
        return returnItem;
    }

    /**
     * Attempts to set the focus back on the searchBar
     */
    public setFocus(): void {
        this.searchBar.focus();
    }

    /**
     * Checks the size of the keyword-div in order to move the input to the next line
     * @private
     */
    private checkSearchBarSize(deleteAction = false): void {
        if (this.keywordDiv.clientWidth <= 320) {
            if (!deleteAction) {
                return;
            }

            this.searchInput.style.paddingTop = 'unset';
            this.searchInput.style.flexDirection = 'row';
            this.searchInput.style.paddingLeft = 'unset';
            return;
        }

        this.searchInput.style.paddingTop = '10px';
        this.searchInput.style.flexDirection = 'column';
        this.searchInput.style.paddingLeft = '10px';
    }
}
</script>

<style lang="scss" scoped>
.search-wrapper {
    width: 600px;
    max-width: 600px;
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
    //display: flex;
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
