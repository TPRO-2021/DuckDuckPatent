<template>
    <div>
        <Skeleton width="100%" height="16px"></Skeleton>
        <Skeleton width="80%" height="16px"></Skeleton>
        <br />
        <Skeleton width="100%" height="12px" v-for="(_i, i) of Array.from(Array(5).keys())" :key="i"></Skeleton>
        <Skeleton width="100%" height="12px"></Skeleton>
        <Skeleton width="60%" height="12px"></Skeleton>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'PreviewPlaceholder.vue',
});
</script>

<style scoped></style>
