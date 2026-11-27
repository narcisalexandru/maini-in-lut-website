import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsModule } from '../artists/artists.module';
import { InboxMessage } from './entities/inbox-message.entity';
import { InboxRead } from './entities/inbox-read.entity';
import { InboxThread } from './entities/inbox-thread.entity';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboxThread, InboxMessage, InboxRead]),
    ArtistsModule,
  ],
  controllers: [InboxController],
  providers: [InboxService],
})
export class InboxModule {}
