<template>
    <div class="patent-small-preview" v-if="isCollapsed" @mouseover="isCollapsed = false">
        <div class="patent-title">
            {{ patent.patent_title }}
        </div>
    </div>
    <div class="patent-preview" v-if="!isCollapsed" @mouseleave="isCollapsed = true" @mouseout="isCollapsed = true">
        <div class="patent-title">
            <h2>{{ patent.patent_title }}</h2>
        </div>
        <div class="patent-abstract">
            {{ patent.patent_abstract }}
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Patent } from '@/models/Patent';

/**
 * This component previews the content of a patent
 */
export default defineComponent({
    name: 'PatentPreview',
    props: {
        patent: Object as () => Patent,
    },
    data() {
        return {
            isCollapsed: true,
        };
    },
});
</script>

<style lang="scss">
.patent-preview {
    width: 400px;
}
</style>
