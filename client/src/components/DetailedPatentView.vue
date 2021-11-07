<template>
    <Dialog
        v-model:visible="patentAvailable"
        :close-on-escape="true"
        :modal="true"
        v-on:hide="handleClose"
        :dismissable-mask="true"
    >
        <!-- Menu Buttons for interacting with the patent -->
        <div class="settings-container">
            <div class="settings-btn">
                <RoundButton class="round-btn" icon-key="more_horiz" @click="isSubMenuOpen = !isSubMenuOpen" />
            </div>

            <div class="settings-menu" v-if="isSubMenuOpen">
                <!--TODO: Add actions! Once all actions are added this can be moved to a computed property-->
                <RoundButton
                    v-if="isSavedPage"
                    class="round-btn"
                    icon-key="delete_forever"
                    v-on:on-clicked="onRemove"
                />
                <RoundButton v-if="!isSavedPage" class="round-btn" icon-key="push_pin"></RoundButton>
                <RoundButton class="round-btn" icon-key="open_in_new" />
                <RoundButton v-if="!isSavedPage" class="round-btn" icon-key="visibility_off" />
                <RoundButton v-if="!isSavedPage" class="round-btn" icon-key="done" />
            </div>
        </div>
        <template #header>
            <div>
                <div
                    class="patent-title"
                    v-html="highlightTitle(this.extendedPatent.patent.title, this.extendedPatent.searchTerms)"
                ></div>
                <div class="patent-owner">
                    <span v-for="(applicant, index) in extendedPatent.patent.applicants" :key="index">
                        {{ applicant }}
                        <span v-if="index !== extendedPatent.patent.applicants.length - 1">, </span>
                        <span v-if="index <= extendedPatent.patent.applicants.length - 1"> </span>
                    </span>
                </div>
            </div>
        </template>
        <h3>Abstract</h3>
        <div
            class="patent-abstract"
            v-html="highlightAbstract(this.extendedPatent.patent.abstract, this.extendedPatent.searchTerms)"
        ></div>

        <div class="patent-info">
            <div>
                <h3>Inventors</h3>
                <ul class="inventors-list">
                    <li v-for="(inventor, index) in extendedPatent.patent.inventors" :key="index">{{ inventor }}</li>
                </ul>
            </div>
            <div>
                <h3>Applicants</h3>
                <ul class="inventors-list">
                    <li v-for="(applicant, index) in extendedPatent.patent.applicants" :key="index">{{ applicant }}</li>
                </ul>
            </div>
        </div>

        <template #footer>
            <!-- Divide the card in 3 column:First column hold the attachments second the keywords and last the exploration button -->
            <div class="footer-container">
                <div class="patent-additional-info">
                    <div class="keywords">
                        <div class="label-keywords">Searched keywords:</div>
                        <span class="keyword-chips">
                            <Chip
                                v-for="(keyword, index) in extendedPatent.searchTerms"
                                :key="index"
                                :has-action="false"
                                :text="keyword"
                            ></Chip>
                        </span>
                    </div>
                    <div class="attachments">
                        <div class="label-attachment">Attachments</div>
                        <div class="attachment-items" v-if="documents">
                            <Attachment
                                v-for="(attachment, index) in documents"
                                :key="index"
                                :type="attachment.type"
                                v-on:on-open="openDocument(attachment.url)"
                            ></Attachment>
                        </div>
                        <!-- Display skeleton to indicate loading -->
                        <div class="attachment-items" v-if="!documents">
                            <div class="card box-shadow" v-for="(_item, index) in [1, 2, 3]" :key="index">
                                <Skeleton width="60px" height="30px"></Skeleton>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="column btn-exploration">
                    <Button icon-key="travel_explore" btn-text="Start exploration" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import RoundButton from '../components/RoundButton.vue';
import Button from '@/components/Button.vue';
import { ExtendedPatent } from '@/models/ExtendedPatent';
import DocumentService from '@/services/document.service';
import { DocumentInformation } from '@/models/DocumentInformation';
import Chip from '@/components/Chip.vue';
import Attachment from '@/components/Attachment.vue';

/**
 * This component previews the content of a patent
 */
export default defineComponent({
    name: 'DetailedPatentView',
    components: {
        Attachment,
        Button,
        Chip,
        RoundButton,
    },
    props: {
        extendedPatent: { type: Object },
        isSavedPage: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['onClose', 'removeFromSaved'],
    data() {
        return {
            pageDisplay: '',
            isSubMenuOpen: false,
            index: 0,
            saved: true,
            /**
             * Holds the submenu buttons
             */
            optionButtons: [
                { iconKey: 'push_pin', action: 'save' },
                { iconKey: 'visibility_off', action: 'dontLike' },
                { iconKey: 'done', action: 'like' },
            ],
            patentAvailable: false,
            documentService: new DocumentService(),
            documents: null as DocumentInformation[] | null,
        };
    },
    watch: {
        async extendedPatent(newVal: ExtendedPatent): Promise<void> {
            this.patentAvailable = !!newVal;

            // if a new patent is available load the documents for it
            if (this.patentAvailable) {
                this.$store.commit('SHOW_LOADING_BAR');
                try {
                    this.documents = await this.documentService.query(
                        (this.extendedPatent as ExtendedPatent)?.patent?.id,
                    );
                } catch (err) {
                    console.error(err);
                }
                this.$store.commit('HIDE_LOADING_BAR');
            }
        },
    },
    methods: {
        handleClose(): void {
            this.patentAvailable = false;
            this.documents = null;
            this.$emit('onClose');
        },
        /**
         * Closes the modal and emits the removeFromSave event
         */
        onRemove(): void {
            this.patentAvailable = false;
            this.$emit('removeFromSaved');
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

        openDocument(url: string) {
            console.log(url);
        },
    },
});
</script>

<style lang="scss" scoped>
.settings-container {
    position: absolute;
    right: 24px;
    top: 36px;
    display: flex;
    flex-direction: column;
}

.round-btn {
    width: 32px;
    height: 32px;
}

.patent-title {
    text-align: left;
    padding-right: 42px;
    font-style: normal;
    font-weight: normal;
    font-size: 20px;
}

.patent-abstract {
    flex-grow: 1;
    text-align: justify;
    padding-right: 60px;
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    padding-bottom: 24px;
    overflow-y: auto;
}

.patent-owner {
    padding-bottom: 12px;
    text-align: left;
    font-style: normal;
    font-weight: 200;
    font-size: 15px;
}

.settings-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 20px;
}

.settings-button {
    margin-bottom: 14px;
}

.label-attachment {
    text-align: left;
    transform: translateX(10px);
}

.attachments {
    display: flex;
    flex-direction: column;
    margin: 10px;
}

.attachment-items {
    display: flex;
}

.attachment {
    border: 1px solid #cccccc;
    box-sizing: border-box;
    border-radius: 10px;
    width: 250px;
    height: 146px;
    padding: 10px;
}
.pdf-doc {
    display: inline-flex;
    background: rgba(196, 196, 196, 0.22);
    border: 1px solid #000000;
    box-sizing: border-box;
    width: 220px;
    height: 100px;
}
.name-doc {
    position: absolute;
    display: flex;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 240px;
    gap: 126px;
}
.material-icons {
    cursor: pointer;
}

.keywords {
    display: flex;
    flex-direction: column;
    margin: 10px;
}

.keyword-chips {
    display: flex;
    margin: 6px 10px 6px 0;
}

.label-keywords {
    display: flex;
    align-items: flex-start;
}

.btn-exploration {
    width: 230px;
    display: flex;
    align-items: flex-end;
}

.footer-container {
    width: 100%;
    height: 100%;
    display: flex;
    gap: 40px;
    justify-content: space-between;
}

.patent-additional-info {
    display: flex;
    flex-grow: 1;
    gap: 40px;
}

.patent-info {
    display: flex;
    width: 100%;
    gap: 120px;
}

.inventors-list {
    transform: translateX(20px);
}
</style>
