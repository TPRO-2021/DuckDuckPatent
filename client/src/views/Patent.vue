<template>
    <div class="patent-page">
        <div class="patent-controls">
            <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
        </div>
        <div class="patent-info">
            <div class="patent-title">this.patent.patent.title</div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '@/components/RoundButton.vue';
import { Patent } from '@/models/Patent';
import PatentService from '@/services/patent.service';
import { ExtendedPatent } from '@/models/ExtendedPatent';
export default defineComponent({
    name: 'Patent',
    components: { RoundButton },
    data() {
        return { patentService: new PatentService() };
    },
    computed: {
        patentId(): string {
            return (this.$route.query.patentID as string) || '';
        },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        patent(): ExtendedPatent {
            return this.$store.state.extendedPatents[this.patentId];
        },
    },
    methods: {
        /**
         * Attempts to take the user back to the previous page
         */
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            if (this.searchTerms.length === 0) {
                this.$router.push({ path: '/' });
                return;
            }

            this.$router.push({ path: 'search', query: { terms: this.searchTerms } });
        },
        highlightTitle(title: string, keywords: string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return title.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },
    },
});
</script>

<style lang="scss" scoped>
.patent-page {
    height: 100vh;
    width: 100%;
}
.patent-controls {
    position: sticky;
    top: 0;
    left: 0;
    width: 500px;
    display: flex;
    gap: 20px;
    padding: 20px;
}
.back-btn {
    height: 40px;
    width: 40px;
}
.patent-title {
    text-align: left;
    padding-right: 50px;
    font-style: normal;
    font-weight: normal;
    font-size: 30px;
}
.patent-owner {
    padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}
</style>
