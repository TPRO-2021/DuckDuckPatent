<template>
    <Dialog
        id="main-dialog"
        style="height: 350px; width: 650px"
        v-model:visible="previewAvailable"
        :close-on-escape="true"
        :dismissable-mask="true"
        :closable="false"
        position="bottomleft"
    >
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container no-select" v-if="dataAvailable">
            <div class="settings-btn">
                <RoundButton class="round-btn" icon-key="more_horiz" @click="settingsMenu = !settingsMenu" />
            </div>
            <div class="settings-menu" v-if="settingsMenu">
                <RoundButton v-if="current.showSave" class="round-btn" icon-key="bookmark" @click="this.savePatent" />
                <RoundButton class="round-btn" icon-key="read_more" @click="this.showMore" />
            </div>
        </div>
        <template #header>
            <div v-if="!dataAvailable" class="placeholder-container">
                <Skeleton height="18px" width="90%"></Skeleton>
                <Skeleton height="18px" width="30%"></Skeleton>
                <Skeleton height="14px" width="20%" style="margin-top: 10px"></Skeleton>
            </div>
            <div v-if="dataAvailable">
                <div class="patent-title">{{ current.title }}</div>

                <div class="patent-owner">{{ current.subTitle }}</div>
            </div>
        </template>

        <div class="patent-abstract" v-if="dataAvailable">
            <p :class="settingsMenu ? 'open-menu' : ''">{{ current.mainText }}</p>
        </div>
        <!-- Show placeholder when loading -->
        <div class="patent-abstract placeholder-container" v-if="!dataAvailable">
            <Skeleton width="100%" height="14px"></Skeleton>
            <Skeleton width="100%" height="14px"></Skeleton>
            <Skeleton width="100%" height="14px"></Skeleton>
            <Skeleton width="100%" height="14px"></Skeleton>
            <Skeleton width="100%" height="14px"></Skeleton>
            <Skeleton width="80%" height="14px"></Skeleton>
        </div>
        <div class="patent-navigation no-select" v-if="!isAsyncResource">
            <!-- Navigation buttons -->
            <span class="material-icons search-icon" @click="displayPreviousPatent()">arrow_back</span>
            <span class="material-icons search-icon" @click="displayNextPatent()">arrow_forward</span>
        </div>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';

/**
 * This component previews the content of a patent inside of a small modal using PrimeVue's Dialog component
 */
export default defineComponent({
    name: 'PatentPreview',
    components: { RoundButton },
    props: {
        current: {
            type: Object,
        },
        terms: {
            type: Array,
        },
        isAsyncResource: {
            type: Boolean,
            default: false,
        },
    },
    emits: {
        onChangePatent: (event: { direction: string }) => event,
        onSavePatent: (event: { id: string }) => event,
        onShowMore: (event: { id: string; searchTerms: string[] }) => event,
    },
    data() {
        return {
            isCollapsed: true,
            /**
             * Holds the info about available buttons
             */
            optionButtons: [
                { iconKey: 'bookmark', action: this.savePatent },
                { iconKey: 'read_more', action: this.showMore },
            ],
            previewAvailable: true,
            settingsMenu: false,
        };
    },
    computed: {
        /**
         * Determines whether data is available or still loading
         */
        dataAvailable(): boolean {
            return this.isAsyncResource ? !!this.current : true;
        },
    },
    watch: {
        /**
         * Watches the current patent. If it changes the components state should be reset
         */
        current() {
            this.resetState();
        },
    },
    methods: {
        /**
         * Checks if next button is clicked then emit an event to ask the parent to send next patent
         */
        displayNextPatent(): void {
            this.$emit('onChangePatent', { direction: 'next' });
            this.resetState();
        },

        /**
         * Checks if back button is clicked then emit an event to ask the parent to send previous patent
         */
        displayPreviousPatent(): void {
            this.$emit('onChangePatent', { direction: 'previous' });
            this.settingsMenu = false;
        },

        /**
         * Adds a patent to the saved items list
         */
        savePatent(): void {
            const id = this.current?.id as string;
            this.$emit('onSavePatent', { id });
            this.settingsMenu = false;
        },

        /**
         * Displays the DetailedPatentView on Click Show more
         */
        showMore(): void {
            const id = this.current?.id as string;
            const searchTerms = this.terms as string[];
            this.$emit('onShowMore', { id, searchTerms });
            this.settingsMenu = false;
        },

        /**
         * Resets all state variables to their default value
         */
        resetState() {
            // reset preview values
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
    text-align: justify;
    padding-right: 70px;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
}
.patent-abstract {
    text-align: justify;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    margin-bottom: 32px;
    flex-grow: 1;
}

.patent-navigation {
    position: absolute;
    bottom: 22px;
    right: 32px;

    display: flex;
    gap: 12px;

    span:hover {
        cursor: pointer;
    }
}

.patent-owner {
    //padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}

.settings-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 100;
}

.settings-btn {
    margin-bottom: 14px;
}

.preview-content {
    display: flex;
    gap: 10px;
}
.document-preview {
    min-width: 300px;
    min-height: 150px;
    max-height: 200px;
}

.document-btn {
    cursor: pointer;
}

.document-btn:hover {
    transition: 0.5s all ease;
    background: black;
    color: white;
}

.document-placeholder {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
.open-menu {
    opacity: 0.5;
}

.placeholder-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
</style>
