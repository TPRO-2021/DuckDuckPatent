import { Patent } from '@/models/Patent';
import { NodeInfo } from '@/models/NodeInfo';
import { PatentMap } from '@/models/PatentMap';
import { PatentPreview } from '@/models/PatentPreview';
import { NodePreview } from '@/models/NodePreview';

export default class PreviewHelperService {
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
}
