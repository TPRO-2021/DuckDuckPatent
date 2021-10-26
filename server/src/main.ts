import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: ['http://localhost:8080', /\.duckduckpatent\.com$/],
        credentials: true,
        allowedHeaders: ['X-Total-Count'],
        exposedHeaders: ['X-Total-Count'],
    });
    await app.listen(3000);
}
bootstrap();
