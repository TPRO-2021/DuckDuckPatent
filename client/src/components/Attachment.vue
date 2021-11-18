<template>
    <div class="card box-shadow attachment-card no-select" @click="$emit('onOpen')">
        <span class="material-icons">{{ getIconKey(type) }}</span>
        <span>{{ getText(type) }}</span>
        <span class="material-icons">launch</span>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Component which provides an attachment button
 *
 * The attachment can receive a attachment type which is used to determine the icon as well as the attachments url.
 * Its emitting the 'on-open' event on clicking the attachment
 * */
export default defineComponent({
    name: 'Attachment',
    props: {
        type: String,
        url: String,
    },
    emits: ['onOpen'],
    methods: {
        /**
         * Gets the icon key depending on the attachment type
         * @param type  The type of the attachment
         */
        getIconKey(type: string): string {
            switch (type) {
                case 'drawing':
                    return 'insert_photo';
                case 'fulldocument':
                    return 'picture_as_pdf';

                default:
                    return 'image';
            }
        },

        /**
         * Gets the text for the attachment button based on the attachments type
         * @param type  The type of the attachment
         */
        getText(type: string): string {
            switch (type) {
                case 'drawing':
                    return 'Drawing';
                case 'fulldocument':
                    return 'Document';

                default:
                    return 'Image';
            }
        },
    },
});
</script>

<style lang="scss" scoped>
.attachment-card {
    display: flex;
    gap: 20px;
}

.attachment-card:hover {
    cursor: pointer;
    background: black;
    color: white;
    transition: all 0.5s ease;
}
</style>
