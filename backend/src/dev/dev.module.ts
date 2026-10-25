import { Module } from '@nestjs/common';
import { DevController } from './dev.controller.js';

/** Dev-only helpers (the "sign in as" user list); every route answers 404 unless DEV_LOGIN=true. */
@Module({ controllers: [DevController] })
export class DevModule {}
