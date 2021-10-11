import { PatentsController } from './patents.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { MockPatentsService } from './patents.service.mock';

describe('PatentsController', () => {
    let patentsController: PatentsController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [PatentsController],
            providers: [MockPatentsService],
        }).compile();

        patentsController = app.get<PatentsController>(PatentsController);
    });

    describe('/search', () => {
        it('should return "[]" for bad search', () => {
            expect(patentsController.query({ terms: [] })).toEqual([]);
        });

        it('should return one or more results for bread', () => {
            expect(patentsController.query({ terms: ['bread'] }).length).toBeGreaterThan(0);
        });
    });
});
