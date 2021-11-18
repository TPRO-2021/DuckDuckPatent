import { KeywordController } from './keyword.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { KeywordService } from './keyword.service';
import { HttpService } from '@nestjs/axios';
import { FactoryProvider } from '@nestjs/common';
import { of } from 'rxjs';
import { SuggestionAPIResponse } from './models';

/**
 * KeywordController Unit test
 */
describe('KeywordController', () => {
    let keywordController: KeywordController;
    let httpService: HttpService = {} as HttpService;

    beforeAll(async () => {
        httpService = {} as HttpService;
        const HttpServiceProvider: FactoryProvider = {
            provide: HttpService,
            useFactory: () => httpService,
        };

        const app: TestingModule = await Test.createTestingModule({
            controllers: [KeywordController],
            providers: [KeywordService, HttpServiceProvider],
        }).compile();

        keywordController = app.get<KeywordController>(KeywordController);
    });

    /**
     * Test retrieval of keyword suggestions
     */
    describe('/keyword', () => {
        it('should return one or more results for flour', async () => {
            const data: SuggestionAPIResponse = [['bread', 0.4]];
            httpService['get'] = <T>() => {
                return of({
                    data: data as unknown as T,
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {},
                });
            };
            const suggestions = await keywordController.query({ flour: true });
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });
});
