import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements' })
  async findAll() {
    return this.announcementsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create announcement' })
  async create(@Body() body: any) {
    return this.announcementsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update announcement' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.announcementsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement' })
  async delete(@Param('id') id: string) {
    return this.announcementsService.delete(id);
  }
}