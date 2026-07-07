import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RESPONSE } from 'src/common/constants/response.constants';
import { GetTimeSlotsQueryDto } from './dto/get-time-slots.query.dto';

/**
 * Public booking endpoints — no auth required.
 * Uses org slug in URL to identify which clinic.
 */
@ApiTags('Booking (Public)')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get(':orgSlug/services')
  async getServices(@Param('orgSlug') orgSlug: string) {
    return {
      message: RESPONSE.BOOKING.SERVICES_FETCHED,
      data: await this.bookingService.getServicesBySlug(orgSlug),
    };
  }

  @Get(':orgSlug/time-slots')
  async getTimeSlots(
    @Param('orgSlug') orgSlug: string,
    @Query() query: GetTimeSlotsQueryDto,
  ) {
    return {
      message: RESPONSE.BOOKING.SLOTS_FETCHED,
      data: await this.bookingService.getTimeSlots(
        orgSlug,
        query.date,
        query.serviceId,
      ),
    };
  }

  @Post(':orgSlug')
  async createBooking(
    @Param('orgSlug') orgSlug: string,
    @Body() dto: CreateBookingDto,
  ) {
    return {
      message: RESPONSE.BOOKING.CREATED,
      data: await this.bookingService.createBooking(orgSlug, dto),
    };
  }

  @Get('info/:bookingId')
  async getBookingInfo(@Param('bookingId') bookingId: string) {
    return {
      message: RESPONSE.BOOKING.INFO_FETCHED,
      data: await this.bookingService.getBookingInfo(bookingId),
    };
  }
}
