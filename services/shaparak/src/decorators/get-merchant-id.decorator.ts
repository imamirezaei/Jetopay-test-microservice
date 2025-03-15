// decorators/get-merchant-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetMerchantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.merchantId;
  },
);