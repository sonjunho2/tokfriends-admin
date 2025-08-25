import { Module } from '@nestjs/common';
import { BannedWordsService } from './banned-words.service';
import { BannedWordsController } from './banned-words.controller';

@Module({
  providers: [BannedWordsService],
  controllers: [BannedWordsController],
})
export class BannedWordsModule {}