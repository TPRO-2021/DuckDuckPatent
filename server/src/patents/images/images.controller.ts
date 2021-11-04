import { Controller, Get, Param } from '@nestjs/common';

@Controller('patents/:patentId/images')
export class ImagesController {
    @Get('')
    async query(@Param('patentId') patentId) {
        return `Hello ${patentId}`;
    }
}
