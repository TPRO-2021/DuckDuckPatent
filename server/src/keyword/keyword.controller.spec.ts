import { KeywordController } from './keyword.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { KeywordService } from './keyword.service';

describe('KeywordController', () => {
    let keywordContoller: KeywordController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [KeywordController],
            providers: [KeywordService],
        }).compile();

        keywordContoller = app.get<KeywordController>(KeywordController);
    });

    describe('/search', () => {
        it('should return one or more results for bread', () => {
            expect(keywordContoller.query({ terms: ['bread'] }).length).toBeGreaterThan(0);
        });
    });
});
