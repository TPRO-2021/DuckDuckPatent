import { KeywordController } from './keyword.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { KeywordService } from './keyword.service';
import { HttpService } from '@nestjs/axios';
import { FactoryProvider } from '@nestjs/common';
import { of } from 'rxjs';
import { SuggestionAPIResponse } from '../models';

describe('KeywordController', () => {
    let keywordContoller: KeywordController;
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

        keywordContoller = app.get<KeywordController>(KeywordController);
    });

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
            const suggestions = await keywordContoller.query({ flour: true });
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });
});
