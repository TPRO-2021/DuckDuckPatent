<template>
    <div class="main-container box-shadow card">
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container">
            <div class="settings-btn">
                <RoundButton
                    class="round-button"
                    style="margin-bottom: 15px"
                    icon-key="more_horiz"
                    @click="settingsMenu = !settingsMenu"
                />
            </div>
            <div class="settings-menu" v-if="settingsMenu">
                <RoundButton
                    v-for="(option, index) in optionButtons"
                    :key="index"
                    class="round-button"
                    :icon-key="option.iconKey"
                />
            </div>
        </div>

        <div class="patent-info">
            <div class="patent-title">
                <h2>{{ patent.patent_title }}</h2>
            </div>

            <div class="patent-owner">Company/Author</div>

            <div class="patent-abstract">
                <p>{{ patent.patent_abstract.slice(0, 400) }}...</p>
            </div>
        </div>

        <div class="patent-navigation">
            <!-- Navigation buttons -->
            <span class="material-icons search-icon" @click="displayPreviousPatent()">arrow_back</span>
            <span
                class="material-icons search-icon"
                @click="
                    next = true;
                    displayNextPatent();
                "
                >arrow_forward</span
            >
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
            settingsMenu: false,
            next: false,
            index: 0,
            /**
             * Holds the info about available buttons
             */
            optionButtons: [
                { iconKey: 'push_pin', action: 'pin' },
                { iconKey: 'visibility_off', action: 'hide' },
                { iconKey: 'done', action: 'suggestMore' },
                { iconKey: 'read_more', action: 'readMore' },
            ],
        };
    },
    methods: {
        /**
         * Method to check if next button is clicked then emit an event to ask the parent to send next patent
         */
        displayNextPatent(): void {
            if (this.next) {
                this.index++;
            }

            this.$emit('onClickNext', { index: this.index });
        },
        /**
         * Method to check if back button is clicked then emit an event to ask the parent to send previous patent
         */
        displayPreviousPatent(): void {
            if (this.next) {
                this.index--;
            }

            this.$emit('onClickBack', { index: this.index });
        },
    },
});
</script>

<style lang="scss" scoped>
.main-container {
    display: flex;
    justify-content: start;
    flex-direction: column;
    width: 800px;
    min-height: 400px;
}

.menu {
    display: flex;
    justify-content: start;
    position: absolute;
    right: 30px;
    top: 30px;
}

.settings-container {
    position: absolute;
    right: 20px;
    top: 20px;
    display: flex;
    flex-direction: column;
}

.round-button {
    width: 30px;
    height: 30px;
}

.patent-info {
    justify-content: start;
    transition: 0.5s;
    margin: 8px;
}

.patent-title {
    text-align: left;
    padding-right: 42px;
}
.patent-abstract {
    text-align: left;
    padding-right: 60px;
    font-size: 0.75vw;
}

.patent-navigation {
    position: absolute;
    bottom: 20px;
    right: 20px;

    display: flex;
    gap: 20px;

    span:hover {
        cursor: pointer;
    }
}

.patent-owner {
    padding: 6px 0;
    text-align: left;
    font-weight: lighter;
}

.settings-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
</style>
