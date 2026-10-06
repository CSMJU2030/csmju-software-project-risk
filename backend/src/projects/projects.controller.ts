import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CollectionResult } from '../common/api-response';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @RequirePermissions(Permission.PROJECT_READ_ANY)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.projectsService.findAll(query.page, query.limit).then(
      (result) => new CollectionResult(result.data, result.meta),
    );
  }

  @RequirePermissions(Permission.PROJECT_CREATE)
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @RequirePermissions(Permission.PROJECT_READ_ANY)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @RequirePermissions(Permission.PROJECT_UPDATE_ANY)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @RequirePermissions(Permission.PROJECT_DELETE_ANY)
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }
}


