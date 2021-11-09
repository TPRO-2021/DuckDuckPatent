<template>
    <Dialog
        id="main-dialog"
        style="height: 350px; width: 650px"
        :visible="!!current"
        :close-on-escape="true"
        :dismissable-mask="true"
        :closable="false"
        position="bottomleft"
    >
        <template #header>
            <div>
                <div :class="{ 'node-preview-title': true, [current.type]: true }">{{ current.title }}</div>

                <div class="node-preview-subtitle">{{ current.subTitle }}</div>
            </div>
        </template>
        <div class="node-preview-body">
            <div
                v-for="rel in current.relatedPatents"
                :key="rel.id"
                class="node-preview-related"
                @click="$emit('onSelectPatent', { id: rel.id })"
            >
                <span class="node-preview-related-id">{{ rel.id }}</span> {{ rel.title }}
            </div>
        </div>
        <div class="node-preview-navigation no-select">
            <!-- Navigation buttons -->
            <span class="material-icons search-icon" @click="displayPrevious()">arrow_back</span>
            <span class="material-icons search-icon" @click="displayNext()">arrow_forward</span>
        </div>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { NodePreview } from '@/models/NodePreview';

/**
 * This component previews the content of a patent
 */
export default defineComponent({
    name: 'NodePreview',
    components: {},
    props: {
        current: { type: Object },
    },
    emits: {
        onControlChange: (event: { direction: 'next' | 'previous' }) => event,
        onSelectPatent: (event: { id: string }) => event,
    },
    data() {
        return {
            showOptionsMenu: false,
            model: null as NodePreview | null,
        };
    },
    watch: {
        current() {
            this.showOptionsMenu = false;
        },
    },
    methods: {
        /**
         * Method to check if next button is clicked then emit an event to ask the parent to send next patent
         */
        displayNext(): void {
            this.$emit('onControlChange', { direction: 'next' });
            this.showOptionsMenu = false;
        },
        /**
         * Method to check if back button is clicked then emit an event to ask the parent to send previous patent
         */
        displayPrevious(): void {
            this.$emit('onControlChange', { direction: 'previous' });
            this.showOptionsMenu = false;
        },
    },
});
</script>

<style lang="scss" scoped>
@import '../styles/colors.scss';

#main-dialog {
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    max-width: 30vw !important;
    max-height: 30vh !important;
    backdrop-filter: unset !important;
}

.node-preview-title {
    text-align: left;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
    margin-bottom: 10px;
}

.node-preview-title.citation {
    color: white;
    background-color: $green;
    border-radius: 10px;
    padding: 0 10px;
}
.node-preview-body {
    text-align: left;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
}

.node-preview-related {
    font-weight: bold;
    box-shadow: 0 0 10px grey;
    border-radius: 10px;
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    cursor: pointer;
}

.node-preview-related-id {
    background-color: $brown;
    border-radius: 10px;
    color: white;
    padding: 0 10px;
}

.node-preview-navigation {
    position: absolute;
    bottom: 32px;
    right: 32px;

    display: flex;
    gap: 12px;

    span:hover {
        cursor: pointer;
    }
}

.node-preview-subtitle {
    padding-left: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}
</style>
