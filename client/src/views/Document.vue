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

/**
 * View which is responsible for displaying the /document page for a selected document
 */
export default defineComponent({
    name: 'Document',
    components: {
        RoundButton,
    },
    data() {
        return {
            documentService: new DocumentService(),
            document: null as DocumentInformation | null,
            page: 1,
            patentId: '',
        };
    },
    computed: {
        /**
         * Returns the content type of the current document (defaults to application/json)
         */
        contentType(): string {
            if (this.document) {
                return DocumentService.getFormat(this.document);
            }
            return 'application/json';
        },
    },
    created() {
        // parse base64 encoded document information from the url to object
        const encodedDoc = this.$route.query.document;
        this.document = JSON.parse(atob(encodedDoc as string)) as DocumentInformation;

        // get other params from the query
        this.patentId = this.$route.query.patentId as string;
        this.page = Number(this.$route.query.page || 1);
    },
    async mounted() {
        // in order to have a more consistent experience the loading screen should appear at least 1s
        this.$store.commit('SHOW_LOADING_SCREEN');
        await Promise.all([this.retrieveDocumentPage(this.page), this.defaultLoadingTime()]);
        this.$store.commit('HIDE_LOADING_SCREEN');
    },
    methods: {
        /**
         * Retrieves a document's page from the backend
         * @param page  The page which should be loaded
         */
        async retrieveDocumentPage(page: number) {
            if (!this.document) {
                return;
            }

            this.$store.commit('SHOW_LOADING_BAR');

            try {
                const doc = await this.documentService.get(this.patentId, this.document, page);

                // create a new object url and select the iframe
                const file = window.URL.createObjectURL(doc);
                const iframe = document.querySelector('iframe');

                // add the file as a source to the iframe
                if (iframe) {
                    iframe.src = `${file}#toolbar=0&navpanes=0`;
                }
            } catch (err) {
                console.error(err);
            }

            this.$store.commit('HIDE_LOADING_BAR');
        },

        /**
         * Handles getting a previous page of the document
         */
        async back() {
            if (this.page === 1) {
                this.page = this.document?.pages || 1;
            } else {
                this.page -= 1;
            }

            await this.retrieveDocumentPage(this.page);
        },

        /**
         * Handles getting the next page of the document
         */
        async forward() {
            if (this.page === this.document?.pages) {
                this.page = 1;
            } else {
                this.page += 1;
            }

            await this.retrieveDocumentPage(this.page);
        },

        /**
         * Returns a promise that should be fulfilled after 1s
         */
        async defaultLoadingTime() {
            return new Promise((res) => {
                setTimeout(() => res(1), 1000);
            });
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
