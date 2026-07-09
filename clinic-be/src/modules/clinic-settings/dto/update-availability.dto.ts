import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'endAfterStart', async: false })
class EndAfterStartConstraint implements ValidatorConstraintInterface {
  validate(end: string, args: ValidationArguments): boolean {
    const schedule = args.object as DayScheduleDto;
    if (typeof schedule?.start !== 'string' || typeof end !== 'string') {
      return false;
    }

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(schedule.start) || !timePattern.test(end)) {
      return false;
    }

    const [startHour, startMinute] = schedule.start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    return endHour * 60 + endMinute > startHour * 60 + startMinute;
  }

  defaultMessage(): string {
    return 'end must be after start';
  }
}

class DayScheduleDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start must be in HH:mm format',
  })
  start: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end must be in HH:mm format',
  })
  @Validate(EndAfterStartConstraint)
  end: string;
}

export class UpdateAvailabilityDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday?: DayScheduleDto;
}
