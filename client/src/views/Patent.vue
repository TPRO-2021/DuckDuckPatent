<template>
    <div class="patent-page">
        <div class="patent-controls">
            <RoundButton class="back-btn" icon-key="reply" @click="goBack"></RoundButton>
        </div>
        <div class="patent-title" v-html="highlightTitle(this.patent.patent.title, this.patent.searchTerms)"></div>

        <div class="patent-owner">
            <span v-for="(applicant, index) in patent.patent.applicants" :key="index">
                {{ applicant }}
                <span v-if="index !== patent.patent.applicants.length - 1">, </span>
                <span v-if="index <= patent.patent.applicants.length - 1"> </span>
            </span>
        </div>
        <div class="patent-abstract">
            <h1>Abstract</h1>
            <div v-html="highlightAbstract(this.patent.patent.abstract, this.patent.searchTerms)"></div>
        </div>

        <div class="patent-info">
            <div>
                <h3>Inventors</h3>
                <ul class="inventors-list">
                    <li v-for="(inventor, index) in patent.patent.inventors" :key="index">{{ inventor }}</li>
                </ul>
            </div>
            <div>
                <h3>Applicants</h3>
                <ul class="inventors-list">
                    <li v-for="(applicant, index) in patent.patent.applicants" :key="index">{{ applicant }}</li>
                </ul>
            </div>
        </div>

        <div class="attachments" v-if="!noDocuments">
            <div class="label-attachment">Attachments</div>
            <div class="attachment-items" v-if="documents">
                <Attachment
                    v-for="(attachment, index) in documents"
                    :key="index"
                    :type="attachment.type"
                    v-on:on-open="openDocument(attachment)"
                ></Attachment>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '@/components/RoundButton.vue';
import PatentService from '@/services/patent.service';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import { DocumentInformation } from '@/models/DocumentInformation';
import DocumentService from '@/services/document.service';
import Attachment from '@/components/Attachment.vue';
export default defineComponent({
    name: 'Patent',
    components: { RoundButton, Attachment },
    data() {
        return {
            patentService: new PatentService(),
            documents: null as DocumentInformation[] | null,
            documentService: new DocumentService(),
            noDocuments: false,
        };
    },
    computed: {
        patentID(): string {
            return (this.$route.query.patentId as string) || '';
        },
        searchTerms(): string[] {
            return this.$store.state.searchTerms;
        },
        patent(): ExtendedPatent {
            return this.$store.state.extendedPatents[this.patentID];
        },
    },
    async created() {
        if (!this.patent) {
            await this.loadPatent();
        }
        await this.loadDocuments();
    },
    // async mounted() {
    //     await this.loadDocuments();
    // },
    methods: {
        /**
         * Attempts to take the user back to the previous page
         */
        goBack(): void {
            // if no search terms are present (after reload) go back to homepage
            this.$router.back();
        },
        highlightTitle(title: string, keywords: string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return title.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },
        highlightAbstract(abstract: string, keywords: string[]) {
            const pattern = new RegExp(`(${keywords.join('|')})`, 'gi');
            return abstract.replace(pattern, (match) => {
                return '<mark style="background-color:rgba(245, 255, 129, 1)">' + match + '</mark>';
            });
        },
        async loadPatent() {
            if (!this.patentID) return;

            try {
                this.$store.commit('SHOW_LOADING_BAR');
                const patent = await this.patentService.get(this.patentID);
                console.log(this.patentID);

                this.$store.commit('STORE_PATENT', { patent, searchTerms: this.searchTerms });
            } catch (err) {
                console.error(err);
            }
            this.$store.commit('HIDE_LOADING_BAR');
        },
        /**
         * Opens the document view and passes the document as a query parameter
         * @param document
         */
        openDocument(document: DocumentInformation) {
            const routeData = this.$router.resolve({
                name: 'Document',
                query: {
                    document: btoa(JSON.stringify(document)),
                    patentId: (this.patent as ExtendedPatent).patent.id,
                    page: 1,
                },
            });

            window.open(routeData.href, '_blank');
        },

        /**
         * Loads the documents for the current patent
         */
        async loadDocuments() {
            // if a new patent is available load the documents for it
            this.$store.commit('SHOW_LOADING_BAR');
            try {
                this.documents = await this.documentService.query((this.patent as ExtendedPatent)?.patent?.id);
            } catch (err) {
                this.noDocuments = true;
                console.error(err);
            }
            this.$store.commit('HIDE_LOADING_BAR');
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
    padding-left: 40px;
    font-weight: bold;
    font-size: 30px;
}
.patent-owner {
    padding-bottom: 70px;
    padding-top: 10px;
    padding-left: 40px;
    text-align: left;
    font-size: 15px;
}
.patent-abstract {
    flex-grow: 1;
    text-align: justify;
    padding-left: 40px;
    padding-right: 40px;
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    padding-bottom: 70px;
    overflow-y: auto;
}
.patent-info {
    display: flex;
    width: 100%;
    gap: 120px;
    padding-left: 40px;
    padding-bottom: 100px;
}

.attachments {
    display: flex;
    flex-direction: column;
    padding-left: 40px;
}
.label-attachment {
    text-align: left;
    transform: translateX(10px);
}

.attachment-items {
    display: flex;
}
attachment {
    border: 1px solid #cccccc;
    box-sizing: border-box;
    border-radius: 10px;
    width: 250px;
    height: 146px;
    padding: 10px;
}
.inventors-list {
    transform: translateX(20px);
}
</style>
