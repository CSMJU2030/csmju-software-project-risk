import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScenariosService } from '../scenarios/scenarios.service';
import { runSimulation, SimulationChangeInput } from '../simulation-engine/simulation-engine';
import { Prisma } from '../generated/prisma/client';

const DB_UNREACHABLE_CODES = ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'];

@Injectable()
export class SimulationsService {
  private readonly logger = new Logger(SimulationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scenariosService: ScenariosService,
  ) { }

  async simulate(scenarioId: string) {
    const scenario = await this.scenariosService.getScenarioOrThrow(scenarioId);

    const changeRows = await this.run(() =>
      this.prisma.scenarioChange.findMany({ where: { scenarioId } }),
    );
    if (changeRows.length === 0) {
      throw new BadRequestException('Scenario has no changes to simulate');
    }

    // Current Project state โ€” "before" เธกเธฒเธเธฒเธเธเธฒเธเธเนเธญเธกเธนเธฅเน€เธชเธกเธญ เนเธกเนเธฃเธฑเธเธเธฒเธ client (Freeze เธเนเธญ 2, 16)
    const project = await this.run(() =>
      this.prisma.project.findUnique({ where: { id: scenario.projectId } }),
    );
    if (!project) {
      // เนเธกเนเธเธงเธฃเน€เธเธดเธ”เธเธถเนเธเนเธ”เน (Scenario เธเธนเธเธเธฑเธ Project เธเนเธฒเธ FK) เนเธ•เนเธเธฑเธเนเธงเนเน€เธเธทเนเธญเธเนเธญเธกเธนเธฅเนเธกเนเธชเธกเธเธนเธฃเธ“เน
      throw new NotFoundException(`Project with id ${scenario.projectId} not found`);
    }

    const [taskRows, dependencyRows] = await Promise.all([
      this.run(() => this.prisma.task.findMany({ where: { projectId: scenario.projectId } })),
      this.run(() =>
        this.prisma.taskDependency.findMany({ where: { task: { projectId: scenario.projectId } } }),
      ),
    ]);

    const riskIds = [...new Set(changeRows.map((c) => c.riskId).filter((id): id is string => !!id))];
    const riskRows = riskIds.length
      ? await this.run(() => this.prisma.risk.findMany({ where: { id: { in: riskIds } } }))
      : [];

    const changes: SimulationChangeInput[] = changeRows.map((c) => ({
      factor: c.factor,
      taskId: c.taskId ?? undefined,
      riskId: c.riskId ?? undefined,
      newValue: Number(c.newValue),
    }));

    let outcome;
    try {
      outcome = runSimulation(
        { teamSize: project.teamSize, budget: Number(project.budget) },
        taskRows.map((t) => ({ id: t.id, duration: t.duration })),
        dependencyRows.map((d) => ({ taskId: d.taskId, dependsOnTaskId: d.dependsOnTaskId })),
        riskRows.map((r) => ({ id: r.id, name: r.name, probability: r.probability, impact: r.impact })),
        changes,
      );
    } catch (error) {
      // Engine throw เน€เธกเธทเนเธญ: เธญเนเธฒเธเธ–เธถเธ Task/Risk เธ—เธตเนเธ–เธนเธเธฅเธเนเธเธซเธฅเธฑเธเธชเธฃเนเธฒเธ ScenarioChange, เธซเธฃเธทเธญ Task graph
      // เธเธฅเธฒเธขเน€เธเนเธ invalid (เนเธกเนเธเธงเธฃเน€เธเธดเธ”เธ–เนเธฒ Phase 2 เธ•เธฃเธงเธ circular dependency เธ–เธนเธเธ•เนเธญเธเธ•เธฑเนเธเนเธ•เนเนเธฃเธ)
      // เธ—เธฑเนเธเธชเธญเธเธเธฃเธ“เธตเธเธทเธญ "เธชเธ–เธฒเธเธฐเธเนเธญเธกเธนเธฅเนเธกเนเธชเธญเธ”เธเธฅเนเธญเธเธเธฑเธ เธ“ เน€เธงเธฅเธฒเธฃเธฑเธ" เธเธถเธเธ•เธญเธ 409 เนเธกเนเนเธเน 500
      throw new ConflictException((error as Error).message);
    }

    const created = await this.run(() =>
      this.prisma.simulation.create({
        data: {
          scenarioId,
          formulaVersion: outcome.formulaVersion,
          beforeDuration: outcome.beforeDuration,
          afterDuration: outcome.afterDuration,
          durationChange: outcome.durationChange,
          beforeBudget: outcome.beforeBudget,
          afterBudget: outcome.afterBudget,
          budgetChange: outcome.budgetChange,
          budgetChangePercent: outcome.budgetChangePercent,
          beforeTeamSize: outcome.beforeTeamSize,
          afterTeamSize: outcome.afterTeamSize,
          riskChanges: outcome.riskChanges as unknown as Prisma.InputJsonValue,
          impactSummary: outcome.impactSummary,
          recommendation: outcome.recommendation,
        },
      }),
    );
    return this.toResponse(created);
  }

  async getAnalysis(id: string) {
    const simulation = await this.run(() =>
      this.prisma.simulation.findUnique({
        where: { id },
      }),
    );

    if (!simulation) {
      throw new NotFoundException(`Simulation with id ${id} not found`);
    }

    const durationChange = simulation.durationChange;
    const budgetChange = Number(simulation.budgetChange);
    const budgetChangePercent =
      simulation.budgetChangePercent === null
        ? null
        : Number(simulation.budgetChangePercent);

    const teamSizeChange =
      simulation.afterTeamSize - simulation.beforeTeamSize;

    const analysis: string[] = [];

    if (durationChange > 0) {
      analysis.push(
        `Project duration increased by ${durationChange} days.`,
      );
    } else if (durationChange < 0) {
      analysis.push(
        `Project duration decreased by ${Math.abs(durationChange)} days.`,
      );
    } else {
      analysis.push('Project duration is unchanged.');
    }

    if (budgetChange > 0) {
      analysis.push(
        `Project budget increased by ${budgetChange.toLocaleString()} THB.`,
      );
    } else if (budgetChange < 0) {
      analysis.push(
        `Project budget decreased by ${Math.abs(budgetChange).toLocaleString()} THB.`,
      );
    } else {
      analysis.push('Project budget is unchanged.');
    }

    if (teamSizeChange > 0) {
      analysis.push(
        `Team size increased by ${teamSizeChange}.`,
      );
    } else if (teamSizeChange < 0) {
      analysis.push(
        `Team size decreased by ${Math.abs(teamSizeChange)}.`,
      );
    } else {
      analysis.push('Team size is unchanged.');
    }

    return {
      simulationId: simulation.id,
      scenarioId: simulation.scenarioId,
      formulaVersion: simulation.formulaVersion,

      before: {
        duration: simulation.beforeDuration,
        budget: Number(simulation.beforeBudget),
        teamSize: simulation.beforeTeamSize,
      },

      after: {
        duration: simulation.afterDuration,
        budget: Number(simulation.afterBudget),
        teamSize: simulation.afterTeamSize,
      },

      changes: {
        duration: durationChange,
        budget: budgetChange,
        budgetPercent: budgetChangePercent,
        teamSize: teamSizeChange,
      },

      riskChanges: simulation.riskChanges,
      analysis,

      impactSummary: simulation.impactSummary,
      recommendation: simulation.recommendation,
    };
  }



  async findOne(id: string) {
    const simulation = await this.run(() =>
      this.prisma.simulation.findUnique({ where: { id } }),
    );
    if (!simulation) {
      throw new NotFoundException(`Simulation with id ${id} not found`);
    }
    return this.toResponse(simulation);
  }

  async findAllForScenario(scenarioId: string) {
    await this.scenariosService.getScenarioOrThrow(scenarioId);
    const simulations = await this.run(() =>
      this.prisma.simulation.findMany({
        where: { scenarioId },
        orderBy: { executedAt: 'desc' },
      }),
    );
    return simulations.map((s) => this.toResponse(s));
  }

  // ---------- helpers ----------

  // Prisma Decimal โ’ number เน€เธเธทเนเธญเนเธซเน JSON เน€เธเนเธเธ•เธฑเธงเน€เธฅเธ (เน€เธซเธกเธทเธญเธ ProjectsService.toResponse)
  private toResponse<
    T extends { beforeBudget: unknown; afterBudget: unknown; budgetChange: unknown; budgetChangePercent: unknown },
  >(simulation: T) {
    return {
      ...simulation,
      beforeBudget: Number(simulation.beforeBudget),
      afterBudget: Number(simulation.afterBudget),
      budgetChange: Number(simulation.budgetChange),
      budgetChangePercent:
        simulation.budgetChangePercent === null ? null : Number(simulation.budgetChangePercent),
    };
  }

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const code = (error as { code?: string })?.code;
      if (code === 'P2025') throw new NotFoundException('Simulation not found');
      this.logger.error(`Database error: ${(error as Error)?.message}`);
      if (code && DB_UNREACHABLE_CODES.includes(code)) {
        throw new ServiceUnavailableException('Database is not reachable');
      }
      throw new InternalServerErrorException('Database error');
    }
  }
}

