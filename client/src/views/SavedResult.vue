<template>
    <div class="saved-page">
        <div>
            <RoundButton class="back-btn" icon-key="reply" @click="backPage"></RoundButton>
            <Button class="saved-btn" iconKey="bookmark" btnText="saved item">Saved</Button>
        </div>
        <div class="saved-list">
            <savedPatent
                v-for="(patent, index) in patents"
                :key="index"
                :savedPatentTitle="patent.title"
                :savedpatentAbstract="patent.abstract"
            >
            </savedPatent>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import savedPatent from '@/components/SavedPatent.vue';
import Button from '@/components/Button.vue';
import RoundButton from '@/components/RoundButton.vue';
import { Patent } from '@/models/Patent';
export default defineComponent({
    name: 'SavedResult',
    components: { RoundButton, savedPatent, Button },
    computed: {
        patents(): Patent[] {
            return this.$store.state.patents;
        },
        // savedPatents():Patent[]
        // {
        //     return this.$store.state.savedPatents;
        // },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
    },
    methods: {
        backPage(): void {
            this.$router.push({ path: '/search', query: { terms: this.searchTerms } });
        },
    },
});
</script>

<style lang="scss" scoped>
.saved-page {
    position: relative;
}
.saved-btn {
    position: absolute;
    left: 128px;
    top: 32px;
}
.back-btn {
    position: absolute;
    left: 78px;
    top: 35px;
    height: 40px;
    width: 40px;
    //margin-left: 5px;
}
.saved-list {
    position: absolute;
    top: 133px;
    left: 78px;
    gap: 65px;
    flex-grow: 5;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding-bottom: 65px;
}
</style>
