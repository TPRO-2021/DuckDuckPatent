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
        <!-- Previewing the Patent title and the patent number -->
        <div class="node-preview-body">
            <div
                v-for="rel in current.relatedPatents"
                :key="rel.id"
                class="node-preview-related box-shadow"
                @click="$emit('onSelectPatent', { id: rel.id })"
            >
                <span class="node-preview-related-id">{{ rel.id }}</span> {{ rel.title }}
            </div>
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
        onSelectPatent: (event: { id: string }) => event,
    },
    data() {
        return {
            model: null as NodePreview | null,
            showOptionsMenu: false,
        };
    },
    watch: {
        /**
         * Watches the input property. On change it should hide the options menu
         */
        current() {
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

.node-preview-title.author {
    color: white;
    background-color: $red;
    border-radius: 10px;
    padding: 0 10px;
}

.node-preview-title.company {
    color: white;
    background-color: $blue;
    border-radius: 10px;
    padding: 0 10px;
}

.node-preview-related-id {
    background-color: $brown;
    border-radius: 10px;
    color: white;
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
    border-radius: 10px;
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    cursor: pointer;
}

.node-preview-subtitle {
    padding-left: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}
</style>
