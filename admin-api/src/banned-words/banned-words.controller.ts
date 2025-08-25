import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { BannedWordsService } from './banned-words.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Banned Words')
@Controller('banned-words')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BannedWordsController {
  constructor(private bannedWordsService: BannedWordsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all banned words' })
  async findAll() {
    return this.bannedWordsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create banned word' })
  async create(@Body() body: any) {
    return this.bannedWordsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update banned word' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.bannedWordsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete banned word' })
  async delete(@Param('id') id: string) {
    return this.bannedWordsService.delete(id);
  }
}