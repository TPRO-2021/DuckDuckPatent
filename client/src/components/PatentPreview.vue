<template>
    <div class="main-container box-shadow card">
        <div class="menu">
            <div class="scrollbtn">
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 15px"
                    icon-key="more_horiz"
                    @click="scrollMenu = check()"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="push_pin"
                    v-show="scrollMenu === true"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="visibility_off"
                    v-show="scrollMenu === true"
                    @click="showText = checkVisibility()"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="done"
                    v-show="scrollMenu === true"
                />
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 5px"
                    icon-key="read_more"
                    v-show="scrollMenu === true"
                />
            </div>
        </div>

        <button type="button" class="back-button" @click="displayPreviousPatent()">
            <span class="material-icons search-icon">arrow_back</span>
        </button>
        <button type="button" class="forward-button" @click="(next = true), displayNextPatent()">
            <span class="material-icons search-icon">arrow_forward</span>
        </button>
        <div class="info-style" v-show="showText === true">
            <h1 id="title" style="margin-bottom: 25px">{{ patent.patent_title }}</h1>

            <p id="abstract">{{ patent.patent_abstract.slice(0, 400) }}...</p>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Patent } from '@/models/Patent';
import RoundButton from '../components/RoundButton.vue';

/**
 * This component previews the content of a patent
 */
export default defineComponent({
    name: 'PatentPreview',
    components: { RoundButton },
    props: {
        patent: { type: Object },
    },
    emits: {
        onClickNext: (event: { index: number }) => {
            return event;
        },
        onClickBack: (event: { index: number }) => {
            return event;
        },
    },
    data() {
        return {
            isCollapsed: true,
            scrollMenu: false,
            showText: false,
            next: false,
            index: 0,
        };
    },
    methods: {
        check(): boolean {
            return !this.scrollMenu;
        },
        //check the visibility button to show the patent info
        checkVisibility(): boolean {
            return !this.showText;
        },
        //method to check if next button is clicked then emit an event to ask the parent to send next patent
        displayNextPatent(): void {
            if (this.next) {
                this.index++;
            }
            const nextIndex = this.index;
            this.$emit('onClickNext', { index: nextIndex });
        },
        //method to check if back button is clicked then emit an event to ask the parent to send previous patent
        displayPreviousPatent(): void {
            if (this.next) {
                this.index--;
            }
            const previousIndex = this.index;
            this.$emit('onClickBack', { index: previousIndex });
        },
    },
});
</script>

<style lang="scss" scoped>
.main-container {
    display: flex;
    justify-content: start;
    flex-direction: column;
    transition: 0.5s;
    position: relative;
}
.menu {
    display: flex;
    justify-content: start;
    position: absolute;
    right: 30px;
    top: 30px;
}
.scrollbtn {
    float: right;
    width: 40px;
    justify-content: space-evenly;
}
.round-button {
    width: 30px;
    height: 30px;
}

.info-style {
    justify-content: start;
    transition: 0.5s;

    margin-left: 20px;
    margin-top: 20px;
}
#title {
    text-align: left;
    padding-right: 60px;
    font-size: 1vw;
}
#abstract {
    text-align: left;
    padding-right: 60px;
    font-size: 0.75vw;
}
.back-button {
    background: none;
    width: 40px;
    height: 40px;
    position: absolute;
    right: 55px;
    bottom: 30px;
}
.forward-button {
    background: none;
    width: 40px;
    height: 40px;
    position: absolute;
    right: 20px;
    bottom: 30px;
}
</style>
