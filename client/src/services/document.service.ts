import HttpService from '@/services/http.service';
import { DocumentInformation } from '@/models/DocumentInformation';

export default class DocumentService extends HttpService {
    /**
     * Queries the backend for images belonging to a patent
     * @param patentId
     */
    async query(patentId: string): Promise<DocumentInformation[] | null> {
        const response = await this.makeRequest(`/api/patents/${patentId}/documents`);
        const json = (await response.json()) as DocumentInformation[];

        this.requestPending = false;
        return json;
    }

    /**
     * Gets a page of the document
     * @param patentId
     * @param document
     */
    async get(patentId: string, document: DocumentInformation): Promise<void> {
        const url = `/api/patents/${patentId}/documents/${btoa(document.url)}?range=${1}`;

        // preferable we want to get a pdf document back
        let type = document.formats.filter((format) => format === 'image/tiff')[0];
        if (!type) {
            type = document.formats[0];
        }

        const response = await this.makeRequest(url, type);

        const doc = await response.blob();
        const docUrl = URL.createObjectURL(new Blob([doc], { type: type }));

        window.open(docUrl, '_blank');
    }
}
