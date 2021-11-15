<template>
    <div class="patent-placeholder">
        <Skeleton width="100%" height="16px"></Skeleton>
        <Skeleton width="80%" height="16px"></Skeleton>
        <Skeleton width="20%" height="16px"></Skeleton>
        <br />
        <Skeleton width="100%" height="12px" v-for="(_i, i) of Array.from(Array(5).keys())" :key="i"></Skeleton>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'PatentPlaceholder',
});
</script>

<style lang="scss" scoped>
.patent-placeholder {
    height: 250px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>
