import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MockPatentsService } from './mock-patents.service';

describe('AppController', () => {
    let appController: AppController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService, MockPatentsService],
        }).compile();

        appController = app.get<AppController>(AppController);
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello()).toBe('Hello World!');
        });
    });

    describe('/search', () => {
        it('should return "[]" for bad search', () => {
            expect(appController.search({ terms: [] })).toEqual([]);
        });

        it('should return one or more results for bread', () => {
            expect(appController.search({ terms: ['bread'] }).length).toBeGreaterThan(0);
        });
    });
});
