import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InsuranceProvider,
  InsuranceProviderSchema,
} from './schemas/insurance-provider.schema';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InsuranceProvider.name, schema: InsuranceProviderSchema },
    ]),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService],
})
export class InsuranceModule {}
