import { PatentsController } from './patents.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { PatentsService } from './patents.service';

describe('PatentsController', () => {
    let patentsController: PatentsController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [PatentsController],
            providers: [
                {
                    provide: PatentsService,
                    useValue: {
                        // TODO: Add mock-service logic here
                        query: async (keywords: string[]) => {
                            if (keywords.length === 0) {
                                return { data: { patents: [] } };
                            }
                        },
                    },
                },
            ],
        }).compile();

        patentsController = app.get<PatentsController>(PatentsController);
    });

    describe('/search', () => {
        it('Should return "[]" for empty search', async () => {
            const patents = await patentsController.query({ keywords: [] });
            expect(patents).toEqual([]);
        });
    });
});
