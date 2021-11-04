<template>
    <div class="main-container box-shadow card">
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container no-select">
            <div class="settings-btn">
                <RoundButton class="round-btn" icon-key="more_horiz" @click="settingsMenu = !settingsMenu" />
            </div>
            <div class="settings-menu" v-if="settingsMenu">
                <RoundButton v-if="!isSaved" class="round-btn" icon-key="push_pin" @click="this.savePatent" />
                <RoundButton class="round-btn" icon-key="visibility_off" @click="this.hidePatent" />
                <RoundButton class="round-btn" icon-key="done" />
                <RoundButton class="round-btn" icon-key="read_more" />
            </div>
        </div>

        <div class="patent-info">
            <div class="patent-title">{{ patent?.title }}</div>

            <!-- TODO: Add applicant/owner of the patent -->
            <div class="patent-owner">Company/Author</div>

            <div class="patent-abstract">
                <p>{{ patent?.abstract?.slice(0, 400) }}...</p>
            </div>
        </div>

        <div class="patent-navigation no-select">
            <!-- Navigation buttons -->
            <span class="material-icons search-icon" @click="displayPreviousPatent()">arrow_back</span>
            <span class="material-icons search-icon" @click="displayNextPatent()">arrow_forward</span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';
import { Patent } from '@/models/Patent';
import { PatentMap } from '@/models/PatentMap';

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
        onChangePatent: (event: { direction: string }) => event,
        onSavePatent: (event: { patent: Patent }) => event,
    },
    data() {
        return {
            isCollapsed: true,
            settingsMenu: false,
            /**
             * Holds the info about available buttons
             */
            optionButtons: [
                { iconKey: 'push_pin', action: this.savePatent },
                { iconKey: 'visibility_off', action: this.hidePatent },
                { iconKey: 'done', action: 'suggestMore' },
                { iconKey: 'read_more', action: 'readMore' },
            ],
        };
    },
    computed: {
        savedPatents(): PatentMap {
            return this.$store.state.savedPatents;
        },
        isSaved(): boolean {
            return (this.$store.state.savedPatents || {})[this.patent?.id];
        },
    },
    methods: {
        /**
         * Method to check if next button is clicked then emit an event to ask the parent to send next patent
         */
        displayNextPatent(): void {
            this.$emit('onChangePatent', { direction: 'next' });
        },
        /**
         * Method to check if back button is clicked then emit an event to ask the parent to send previous patent
         */
        displayPreviousPatent(): void {
            this.$emit('onChangePatent', { direction: 'previous' });
        },
        /**
         * Adds a patent to the saved items list
         */
        savePatent(): void {
            this.$emit('onSavePatent', { patent: this.patent as Patent });
        },
        /**
         * Hides a patent from the results page
         */
        hidePatent(): void {
            // TODO: Implement hide patent functionality
        },
    },
});
</script>

<style lang="scss" scoped>
.main-container {
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    width: 650px;
    min-height: 300px;
}

.menu {
    display: flex;
    justify-content: flex-start;
    position: absolute;
    right: 30px;
    top: 30px;
}

.settings-container {
    position: absolute;
    right: 28px;
    top: 28px;
    display: flex;
    flex-direction: column;
}

.round-btn {
    width: 28px !important;
    height: 28px !important;
}

.patent-info {
    justify-content: flex-start;
    transition: 0.5s;
    margin: 8px;
}

.patent-title {
    text-align: left;
    padding-right: 42px;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
}
.patent-abstract {
    text-align: left;
    padding-right: 60px;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    margin-bottom: 32px;
}

.patent-navigation {
    position: absolute;
    bottom: 32px;
    right: 32px;

    display: flex;
    gap: 12px;

    span:hover {
        cursor: pointer;
    }
}

.patent-owner {
    padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}

.settings-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.settings-btn {
    margin-bottom: 14px;
}
</style>
