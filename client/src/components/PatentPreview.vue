<template>
    <Dialog
        id="main-dialog"
        style="height: 400px; width: 650px"
        v-model:visible="previewAvailable"
        :close-on-escape="true"
        :dismissable-mask="true"
        :closable="false"
        position="bottomleft"
    >
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container no-select">
            <div class="settings-btn">
                <RoundButton class="round-btn" icon-key="more_horiz" @click="settingsMenu = !settingsMenu" />
            </div>
            <div class="settings-menu" v-if="settingsMenu">
                <RoundButton v-if="!isSaved" class="round-btn" icon-key="push_pin" @click="this.savePatent" />
                <RoundButton class="round-btn" icon-key="visibility_off" @click="this.hidePatent" />
                <RoundButton class="round-btn" icon-key="done" />
                <RoundButton class="round-btn" icon-key="read_more" @click="this.showMore" />
            </div>
        </div>
        <template #header>
            <div>
                <div class="patent-title">{{ patent?.title }}</div>

                <!-- TODO: Add applicant/owner of the patent -->
                <div class="patent-owner">
                    {{ patent.applicants[0] }}
                    <span v-if="patent.applicants.length > 1">, ...</span>
                </div>
            </div>
        </template>
        <div class="patent-abstract">
            <p>{{ patent?.abstract?.slice(0, 400) }}...</p>
        </div>
        <div class="patent-navigation no-select">
            <!-- Navigation buttons -->
            <span class="material-icons search-icon" @click="displayPreviousPatent()">arrow_back</span>
            <span class="material-icons search-icon" @click="displayNextPatent()">arrow_forward</span>
        </div>
    </Dialog>
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
        onShowMore: (event: { patent: Patent; searchTerms: string[] }) => event,
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
                { iconKey: 'read_more', action: this.showMore },
            ],
            previewAvailable: true,
        };
    },
    watch: {
        patent() {
            this.settingsMenu = false;
        },
    },
    computed: {
        savedPatents(): PatentMap {
            return this.$store.state.savedPatents;
        },
        isSaved(): boolean {
            return (this.$store.state.savedPatents || {})[this.patent?.id];
        },
        terms(): string[] {
            return this.$store.state.searchTerms;
        },
    },
    methods: {
        /**
         * Method to check if next button is clicked then emit an event to ask the parent to send next patent
         */
        displayNextPatent(): void {
            this.$emit('onChangePatent', { direction: 'next' });
            this.settingsMenu = false;
        },
        /**
         * Method to check if back button is clicked then emit an event to ask the parent to send previous patent
         */
        displayPreviousPatent(): void {
            this.$emit('onChangePatent', { direction: 'previous' });
            this.settingsMenu = false;
        },
        /**
         * Adds a patent to the saved items list
         */
        savePatent(): void {
            this.$emit('onSavePatent', { patent: this.patent as Patent });
            this.settingsMenu = false;
        },
        /**
         * Hides a patent from the results page
         */
        hidePatent(): void {
            // TODO: Implement hide patent functionality
        },
        /**
         * Display the DetailedPatentView on Click Show more
         */
        showMore(): void {
            this.$emit('onShowMore', { patent: this.patent as Patent, searchTerms: this.terms });
            this.settingsMenu = false;
        },
    },
});
</script>

<style lang="scss" scoped>
#main-dialog {
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    max-width: 30vw !important;
    max-height: 30vh !important;
    backdrop-filter: unset !important;
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
