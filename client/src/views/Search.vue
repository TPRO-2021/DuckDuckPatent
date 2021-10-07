<template>
    <div class="container">
        <Logo />
        <Searchbar id="search-bar" />
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Button from '@/components/Button.vue';
import Searchbar from '@/components/Searchbar.vue';
import Logo from '@/components/Logo.vue';

@Options({
    components: {
        Button,
        Searchbar,
        Logo,
    },
    // provide() {
    //     return {
    //         parentKey: [],
    //     };
    // },
})
export default class Search extends Vue {}
</script>

<style lang="scss" scoped>
.container {
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

#search-bar {
    padding: 20px 0;
}
</style>
