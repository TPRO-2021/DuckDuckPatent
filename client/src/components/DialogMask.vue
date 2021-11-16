<template>
    <div class="dialog-mask" v-if="showDialogMask"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Simple component which provides a mask that blurs the background based on the vuex store variable
 * 'showDialogMask'
 */
export default defineComponent({
    name: 'DialogMask',
    computed: {
        /**
         * Determines whether the dialog mask should be shown or not
         */
        showDialogMask(): boolean {
            return this.$store.state.showDialogMask;
        },
    },
});
</script>

<style scoped lang="scss">
.dialog-mask {
    transition: all 1s ease;
    pointer-events: none;
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(5px);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
}
</style>
