import { Controller, Get, Param, Query, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  async findAll(@Query() query: any) {
    return this.reportsService.findAll(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update report status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    return this.reportsService.updateStatus(id, body.status, req.user.userId);
  }
}