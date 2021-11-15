import { Patent } from '@/models/Patent';
import { NodeInfo } from '@/models/NodeInfo';
import { PatentMap } from '@/models/PatentMap';
import { PatentPreview } from '@/models/PatentPreview';
import { NodePreview } from '@/models/NodePreview';

export default class PreviewHelperService {
    /**
     * Helper to get the title, abstract for the patent preview on cliking on the node
     * @param patent
     * @param savedPatents
     */
    static getPatentPreview(patent: Patent, savedPatents: PatentMap): PatentPreview {
        let author = (patent?.applicants ?? [])[0] ?? '';
        if (patent?.applicants?.length ?? 0 > 1) {
            author += '...';
        }
        let abstract = patent?.abstract?.slice(0, 400) ?? '';
        if (patent?.abstract?.length ?? 0 > 400) {
            abstract += '...';
        }
        return {
            id: patent?.id,
            title: patent?.title ?? '',
            subTitle: author,
            mainText: abstract,
            showSave: !(savedPatents || {})[patent?.id],
        };
    }

    /**
     * Helper to get the citation number and related patent for node preview
     * @param node
     * @param patents
     */

    static getCitationPreview(node: NodeInfo, patents: Patent[]): NodePreview {
        const citedPatents = patents.filter((t) => t?.citations?.some((t) => t.id === node?.id));
        return {
            id: node.id,
            title: `CITATION ${node.id}`,
            type: node.type,
            subTitle: 'Cited By',
            relatedPatents: citedPatents,
        };
    }

    /**
     * Helper to get the author name and the invented patents for node preview
     * @param node
     * @param patents
     */

    static getAuthorPreview(node: NodeInfo, patents: Patent[]): NodePreview {
        const authorPatents = patents.filter((patent) => patent.inventors?.includes(node.id));
        return {
            id: node.id,
            title: `${node.id}`,
            type: node.type,
            subTitle: 'Inventor of',
            relatedPatents: authorPatents,
        };
    }

    /**
     * Helper to get the company name and current assignee to the patents
     * @param node
     * @param patents
     */
    static getCompanyPreview(node: NodeInfo, patents: Patent[]): NodePreview {
        const companyPatents = patents.filter((patent) => patent.applicants?.includes(node.id));
        return {
            id: node.id,
            title: `${node.id}`,
            type: node.type,
            subTitle: 'Applicant of',
            relatedPatents: companyPatents,
        };
    }
}
