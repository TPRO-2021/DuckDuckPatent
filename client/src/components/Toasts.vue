<template>
    <Toast position="bottom-right" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

/**
 * This component resembles the toast-message which can be shown to the user with information regarding errors/warnings, ...
 */
export default defineComponent({
    name: 'Toasts',
    components: {
        Toast,
    },
    setup() {
        const toast = useToast();
        const showNoPatentsToast = () => {
            toast.add({
                severity: 'warn',
                summary: 'Oops! No result found :)',
                detail: 'Try modifying your filters or search terms',
                life: 5000,
            });
        };

        const showErrorToast = () => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error occurred', life: 3000 });
        };

        return { showNoPatentsToast, showErrorToast };
    },
    computed: {
        /**
         * Exposes the state variable showNoResultsToast
         */
        showNoResults(): boolean {
            return this.$store.state.showNoResultsToast;
        },
        /**
         * Exposes the state variable showErrorToast
         */
        showError(): boolean {
            return this.$store.state.showErrorToast;
        },
    },
    watch: {
        /**
         * Watches the showResults variable
         * @param newVal    The new value
         */
        showNoResults(newVal) {
            if (newVal) {
                this.showNoPatentsToast();
            }
        },
        /**
         * Watches the showError variable
         * @param newVal    The new value
         */
        showError(newVal) {
            if (newVal) {
                this.showErrorToast();
            }
        },
    },
});
</script>

<style scoped lang="scss"></style>
