
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from 'prisma/generated/client';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;
}