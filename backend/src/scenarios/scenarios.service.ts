import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';

const DB_UNREACHABLE_CODES = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'];

@Injectable()
export class ScenariosService {
  private readonly logger = new Logger(ScenariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: CreateScenarioDto) {
    await this.assertProjectExists(projectId);
    return this.run(() =>
      this.prisma.scenario.create({
        data: { projectId, name: dto.name, description: dto.description },
      }),
    );
  }

  async findAllByProject(projectId: string) {
    await this.assertProjectExists(projectId);
    return this.run(() =>
      this.prisma.scenario.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
    );
  }

  // เธฃเธงเธก changes เธกเธฒเธ”เนเธงเธข เน€เธเธทเนเธญเนเธซเน client เน€เธซเนเธเธชเธ–เธฒเธเธฐเธเธฑเธเธเธธเธเธฑเธเธเธญเธ scenario เธเนเธญเธเธชเธฑเนเธ simulate
  async findOne(id: string) {
    const scenario = await this.run(() =>
      this.prisma.scenario.findUnique({
        where: { id },
        include: { changes: { orderBy: { createdAt: 'asc' } } },
      }),
    );
    if (!scenario) {
      throw new NotFoundException(`Scenario with id ${id} not found`);
    }
    return scenario;
  }

  async remove(id: string) {
    const exists = await this.run(() => this.prisma.scenario.findUnique({ where: { id } }));
    if (!exists) {
      throw new NotFoundException(`Scenario with id ${id} not found`);
    }
    // Cascade เธฅเธ ScenarioChange เนเธฅเธฐ Simulation เธ—เธตเนเน€เธเธตเนเธขเธงเธเนเธญเธเธ•เธฒเธก schema
    await this.run(() => this.prisma.scenario.delete({ where: { id } }));
  }

  // ---------- helpers (เนเธเนเธฃเนเธงเธกเธเธฑเธ ScenarioChangesService/SimulationsService เธเนเธฒเธ export) ----------

  async assertProjectExists(projectId: string) {
    const project = await this.run(() =>
      this.prisma.project.findUnique({ where: { id: projectId } }),
    );
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
  }

  async getScenarioOrThrow(id: string) {
    const scenario = await this.run(() => this.prisma.scenario.findUnique({ where: { id } }));
    if (!scenario) {
      throw new NotFoundException(`Scenario with id ${id} not found`);
    }
    return scenario;
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const code = (error as { code?: string })?.code;
      if (code === 'P2025') throw new NotFoundException('Scenario not found');
      this.logger.error(`Database error: ${(error as Error)?.message}`);
      if (code && DB_UNREACHABLE_CODES.includes(code)) {
        throw new ServiceUnavailableException('Database is not reachable');
      }
      throw new InternalServerErrorException('Database error');
    }
  }
}


