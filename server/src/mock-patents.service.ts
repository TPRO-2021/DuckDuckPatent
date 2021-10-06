import { Injectable } from '@nestjs/common';

const mockPatents: any[] = [
    {
        id: 'PAT-123',
        title: 'Bread',
        date: new Date('2005-12-17T03:24:00'),
        abstract: 'People need to eat. Bread enables people to eat.',
        fulltext: `Caloric intake is important for life. 
Although humans can sometimes eat various grains raw, 
it can be difficult for them to get the full nutrients available. 
this is where bread comes in. Made out of water and grain, it always satisfies.`,
        citations: ['PAT-111'],
    },
    {
        id: 'PAT-111',
        title: 'Grain',
        date: new Date('2002-05-12T03:24:00'),
        abstract: `Chasing animals is hard.
Eating grain gives the user a novel ability to receive key nutrients while standing still.`,
        fulltext: `Everyone has had the experience of chasing a deer for more than a day while hungry. 
With the introduction of grains this will soon be a thing of the past!
All the user has to do is find hardy plants living in their region, harvest their seeds, push them into the ground, sit and wait.`,
        citations: ['PAT-110'],
    },
    {
        id: 'PAT-110',
        title: 'Water',
        date: new Date('2001-02-07T03:24:00'),
        abstract: `Water is a novel solution to surviving in the world today.`,
        fulltext: `Is your mouth dry? Are there certain cactuses and fruits that you just can't get enough of, even when you're full?
With the invention of water for humans, you don't have to walk around thirsty all day just hoping that the weather is cool.
Simply stick your dirty head in a nearby river or pond and drink! It's that simple. Even grain can be grow using water.`,
        citations: [],
    },
];

@Injectable()
export class MockPatentsService {
    search(terms: string[] = []): any[] {
        return mockPatents.filter((t: any) =>
            terms
                .map((k) => k.toLowerCase())
                .some(
                    (k) =>
                        t.id.includes(k) ||
                        t.title.toLowerCase().includes(k) ||
                        t.date.getFullYear.toString() === k ||
                        t.abstract.includes(k) ||
                        t.fulltext.includes(k) ||
                        t.citations.join(',').includes(k),
                ),
        );
    }
}
