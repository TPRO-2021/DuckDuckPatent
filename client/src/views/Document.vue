<template>
    <div class="controls">
        <RoundButton icon-key="arrow_back" :disabled="this.page === 1" v-on:on-clicked="back"></RoundButton>
        <RoundButton
            icon-key="arrow_forward"
            :disabled="page === document?.pages"
            v-on:on-clicked="forward"
        ></RoundButton>
    </div>
    <div id="my-container" class="ng-scope pdf-container">
        <iframe src="" :type="this.contentType" width="100%" height="100%" style="overflow: auto"> </iframe>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { DocumentInformation } from '@/models/DocumentInformation';
import DocumentService from '@/services/document.service';
import RoundButton from '@/components/RoundButton.vue';

export default defineComponent({
    name: 'Document',
    components: {
        RoundButton,
    },
    data() {
        return {
            documentService: new DocumentService(),
            document: null as DocumentInformation | null,
            patentId: '',
            page: 1,
        };
    },
    computed: {
        contentType(): string {
            if (this.document) {
                return DocumentService.getFormat(this.document);
            }
            return 'application/json';
        },
    },
    created() {
        const encodedDoc = this.$route.query.document;

        this.document = JSON.parse(atob(encodedDoc as string)) as DocumentInformation;
        this.patentId = this.$route.query.patentId as string;
        this.page = Number(this.$route.query.page || 1);
    },
    async mounted() {
        this.$store.commit('showLoadingScreen');
        await this.retrieveDocumentPage(this.page);
        this.$store.commit('hideLoadingScreen');
    },
    methods: {
        async retrieveDocumentPage(page: number) {
            if (!this.document) {
                return;
            }

            this.$store.commit('SHOW_LOADING_BAR');

            try {
                const doc = await this.documentService.get(this.patentId, this.document, page);

                const file = window.URL.createObjectURL(doc);

                const iframe = document.querySelector('iframe');

                if (iframe) {
                    iframe.src = `${file}#toolbar=0&navpanes=0`;
                }
            } catch (err) {
                console.error(err);
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        async back() {
            if (this.page === 1) {
                this.page = this.document?.pages || 1;
            } else {
                this.page -= 1;
            }

            await this.retrieveDocumentPage(this.page);
        },

        async forward() {
            if (this.page === this.document?.pages) {
                this.page = 1;
            } else {
                this.page += 1;
            }

            await this.retrieveDocumentPage(this.page);
        },
    },
});
</script>

<style scoped lang="scss">
.pdf-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.controls {
    display: flex;
    position: fixed;
    bottom: 40px;
    width: 100vw;
    justify-content: center;
    gap: 40px;
}
</style>
