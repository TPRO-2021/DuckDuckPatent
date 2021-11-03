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
                <RoundButton class="round-button" icon-key="more_horiz" @click="isSubMenuOpen = !isSubMenuOpen" />
            </div>

            <div class="settings-menu" v-if="isSubMenuOpen">
                <!--TODO: Add actions! Once all actions are added this can be moved to a computed property-->
                <RoundButton
                    v-if="isSavedPage"
                    class="round-button"
                    icon-key="delete_forever"
                    v-on:on-clicked="onRemove"
                />
                <RoundButton v-if="!isSavedPage" class="round-button" icon-key="push_pin"></RoundButton>
                <RoundButton class="round-button" icon-key="open_in_new" />
                <RoundButton v-if="!isSavedPage" class="round-button" icon-key="visibility_off" />
                <RoundButton v-if="!isSavedPage" class="round-button" icon-key="done" />
            </div>
        </div>
        <template #header>
            <div>
                <div class="patent-title">{{ this.extendedPatent.patent.title }}</div>
                <!-- TODO: Add applicant/owner of the patent -->
                <div class="patent-owner">Company/Author</div>
            </div>
        </template>

        <div class="patent-abstract">{{ this.extendedPatent.patent.abstract }}</div>

        <template #footer>
            <!-- Divide the card in 3 column:First column hold the attachments second the keywords and last the exploration button -->
            <div class="footer-container">
                <div class="patent-additional-info">
                    <div class="attachments">
                        <div class="label-attachment">Attachments</div>
                        <div class="attachment">
                            <iframe class="pdf-doc" src="" title="info.pdf" />

                            <div class="name-doc">
                                info.pdf
                                <div>
                                    <span class="material-icons"> open_in_new </span>
                                    <span class="material-icons"> file_download</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="keywords">
                        <span class="keywords label-keywords">Searched keywords:</span>
                        <span class="keywords">
                            <span v-for="(keyword, index) in extendedPatent.searchTerms" :key="index">
                                <span>{{ keyword }}</span>
                                <span v-if="index !== extendedPatent.searchTerms.length - 1">, </span>
                                <span v-if="index <= extendedPatent.searchTerms.length - 1"> </span>
                            </span>
                        </span>
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

/**
 * This component previews the content of a patent
 */
export default defineComponent({
    name: 'DetailedPatentView',
    components: {
        RoundButton,
        Button,
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
        };
    },

    watch: {
        extendedPatent(newVal: ExtendedPatent): void {
            this.patentAvailable = !!newVal;
        },
    },
    methods: {
        handleClose(): void {
            this.patentAvailable = false;
            this.$emit('onClose');
        },
        /**
         * Closes the modal and emits the removeFromSave event
         */
        onRemove(): void {
            this.patentAvailable = false;
            this.$emit('removeFromSaved');
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

.round-button {
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
}

.settings-btn {
    margin-bottom: 14px;
}

.label-attachment {
    text-align: left;
    margin: 15px 0;
}

.attachments {
    display: flex;
    flex-direction: column;
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
    display: block;
    text-align: left;
    padding-left: 124px;
}
.label-keywords {
    padding-top: 15px;
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
    justify-content: space-between;
}

.patent-additional-info {
    display: flex;
    flex-grow: 1;
}
</style>
