import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';

// เธฃเธซเธฑเธช error เธเธญเธ Prisma เธ—เธตเนเนเธเธฅเธงเนเธฒ "เธ•เนเธญเธเธฒเธเธเนเธญเธกเธนเธฅเนเธกเนเนเธ”เน"
const DB_UNREACHABLE_CODES = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'];

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, user?: CoreHubIdentity) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.assertDateRange(startDate, endDate);

    const project = await this.run(() =>
      this.prisma.project.create({
        data: {
          name: dto.name,
          createdBy: user?.id,
          description: dto.description,
          startDate,
          endDate,
          budget: dto.budget,
          teamSize: dto.teamSize,
          status: dto.status, // เธ–เนเธฒเนเธกเนเธชเนเธ เธเธฒเธเธเนเธญเธกเธนเธฅเนเธเนเธเนเธฒ default = PLANNING
        },
      }),
    );
    return this.toResponse(project);
  }

  async findAll(page = 1, limit = 20, user?: CoreHubIdentity) {
    const canSeeAll =
      user?.subsystemRole === SubsystemRole.STAFF ||
      user?.subsystemRole === SubsystemRole.ADMIN;
    const where = !canSeeAll && user ? { createdBy: user.id } : undefined;

    const projects = await this.run(() => this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }));
    const total = await this.run(() => this.prisma.project.count({ where }));
    return {
      data: projects.map((p) => this.toResponse(p)),
      meta: { total, page, limit, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, user?: CoreHubIdentity) {
    const project = await this.getOrThrow(id);
    this.assertProjectAccess(project.createdBy, user);
    return this.toResponse(project);
  }

  async update(id: string, dto: UpdateProjectDto, user?: CoreHubIdentity) {
    const existing = await this.getOrThrow(id);
    this.assertProjectAccess(existing.createdBy, user);

    // เธ•เธฃเธงเธเธเนเธงเธเธงเธฑเธเธ—เธตเนเธเธฒเธเธเนเธฒเธ—เธตเนเธเธฐเน€เธเนเธเธซเธฅเธฑเธเนเธเน (เธเนเธฒเนเธซเธกเน เธ–เนเธฒเนเธกเนเธชเนเธเนเธเนเธเนเธฒเน€เธ”เธดเธก)
    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    this.assertDateRange(startDate, endDate);

    const project = await this.run(() =>
      this.prisma.project.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          startDate: dto.startDate ? startDate : undefined,
          endDate: dto.endDate ? endDate : undefined,
          budget: dto.budget,
          teamSize: dto.teamSize,
          status: dto.status,
        },
      }),
    );
    return this.toResponse(project);
  }

  async remove(id: string, user?: CoreHubIdentity) {
    const existing = await this.getOrThrow(id);
    this.assertProjectAccess(existing.createdBy, user);
    await this.run(() => this.prisma.project.delete({ where: { id } }));
    return { id, deleted: true };
  }

  // ---------- helpers ----------

  private async getOrThrow(id: string) {
    const project = await this.run(() =>
      this.prisma.project.findUnique({ where: { id } }),
    );
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  private assertProjectAccess(createdBy: string | null | undefined, user?: CoreHubIdentity) {
    if (!user) {
      return;
    }
    const canManageAll =
      user.subsystemRole === SubsystemRole.STAFF ||
      user.subsystemRole === SubsystemRole.ADMIN;

    if (!canManageAll && createdBy !== user.id) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  private assertDateRange(startDate: Date, endDate: Date) {
    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'Invalid date range: startDate must not be later than endDate',
      );
    }
  }

  // Prisma Decimal โ’ number เน€เธเธทเนเธญเนเธซเน JSON เน€เธเนเธเธ•เธฑเธงเน€เธฅเธ (เนเธกเนเนเธเน string)
  private toResponse<T extends { budget: unknown }>(
    project: T,
  ): Omit<T, 'budget'> & { budget: number } {
    return { ...project, budget: Number(project.budget) };
  }

  // เธเธฃเธญเธเธเธฒเธฃเน€เธฃเธตเธขเธเธเธฒเธเธเนเธญเธกเธนเธฅ เนเธฅเนเธงเนเธเธฅเธ error เธเธญเธ DB เน€เธเนเธ HTTP error เธ—เธตเนเธญเนเธฒเธเน€เธเนเธฒเนเธ
  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const code = (error as { code?: string })?.code;
      if (code === 'P2025') {
        // record เธ—เธตเนเธเธฐเนเธเน/เธฅเธเธซเธฒเธขเนเธเธฃเธฐเธซเธงเนเธฒเธเธ—เธฒเธ
        throw new NotFoundException('Project not found');
      }

      this.logger.error(`Database error: ${(error as Error)?.message}`);
      if (code && DB_UNREACHABLE_CODES.includes(code)) {
        throw new ServiceUnavailableException('Database is not reachable');
      }
      throw new InternalServerErrorException('Database error');
    }
  }
}



