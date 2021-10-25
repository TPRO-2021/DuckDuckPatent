import { PatentsController } from './patents.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { PatentsService } from './patents.service';
import { Response as Res } from 'express';

describe('PatentsController', () => {
    let patentsController: PatentsController;
    let mockResponse: Res;

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
                                return { patents: [] };
                            }
                        },
                    },
                },
            ],
        }).compile();

        patentsController = app.get<PatentsController>(PatentsController);

        /**
         * Create mock response object
         */
        mockResponse = <Res>{};
        mockResponse.set = () => mockResponse;
        mockResponse.json = (data: any) => {
            return data;
        };
    });

    describe('/search', () => {
        it('Should return "[]" for empty search', async () => {
            const patents = await patentsController.query({ keywords: [] }, mockResponse);
            expect(patents).toEqual([]);
        });
    });
});
