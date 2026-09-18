import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return server metadata', () => {
      const info = appController.getRoot();
      expect(info).toHaveProperty('name', 'Smart Space Booking API');
      expect(info).toHaveProperty('status', 'active');
      expect(info).toHaveProperty('endpoints');
    });

    it('should return health status', () => {
      const health = appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('timestamp');
    });
  });
});
