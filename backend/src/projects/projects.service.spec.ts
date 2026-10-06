import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';

// เนเธกเนเนเธซเธฅเธ”เนเธเธฅเนเธเธฃเธดเธ เน€เธเธฃเธฒเธฐเธ•เนเธญเธเนเธเน Prisma client เธ—เธตเน generate เนเธฅเนเธง (Unit test เนเธเน mock)
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class { } }));

const ID = '3f0c1c1e-6a53-4b7a-9c58-2b1f0d6f9a10';

// Prisma Decimal serialize เน€เธเนเธ string เธ•เธฑเธงเน€เธฅเธ โ’ เธ—เธ”เธชเธญเธเธงเนเธฒ service เนเธเธฅเธเน€เธเนเธ number
const dbProject = (over: Record<string, unknown> = {}) => ({
  id: ID,
  name: 'E-Commerce Platform',
  description: null,
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-01'),
  budget: '100000.00',
  teamSize: 5,
  status: 'PLANNING',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  createdBy: 'user-1',
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...over,
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ProjectsService);
  });

  const user: CoreHubIdentity = {
    id: 'user-1',
    email: 'test@example.com',
    coreRole: 'student',
    subsystemRole: SubsystemRole.STUDENT,
  };

  const createDto = {
    name: 'E-Commerce Platform',
    startDate: '2026-01-01',
    endDate: '2026-03-01',
    budget: 100000,
    teamSize: 5,
  };

  it('create project: เธเธฑเธเธ—เธถเธเนเธฅเธฐเธเธทเธเธเนเธฒ budget เน€เธเนเธ number', async () => {
    prisma.project.create.mockResolvedValue(dbProject());
    const result = await service.create(createDto, user);

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'E-Commerce Platform',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-01'),
        budget: 100000,
        teamSize: 5,
      }),
    });
    expect(result.budget).toBe(100000);
    expect(result.id).toBe(ID);
  });

  it('create project: invalid date range โ’ 400 เนเธฅเธฐเนเธกเนเน€เธฃเธตเธขเธ DB', async () => {
    await expect(
      service.create({ ...createDto, startDate: '2026-04-01', endDate: '2026-03-01' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.project.create).not.toHaveBeenCalled();
  });

  it('create project: startDate เน€เธ—เนเธฒเธเธฑเธ endDate เนเธ”เน', async () => {
    prisma.project.create.mockResolvedValue(dbProject());
    await expect(
      service.create({ ...createDto, startDate: '2026-01-01', endDate: '2026-01-01' }, user),
    ).resolves.toBeDefined();
  });

  it('get all projects', async () => {
    prisma.project.findMany.mockResolvedValue([dbProject(), dbProject({ id: 'x' })]);
    prisma.project.count.mockResolvedValue(2);
    const result = await service.findAll();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].budget).toBe(100000);
    expect(result.meta.total).toBe(2);
  });

  it('get project', async () => {
    prisma.project.findUnique.mockResolvedValue(dbProject());
    const result = await service.findOne(ID);
    expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: ID } });
    expect(result.name).toBe('E-Commerce Platform');
  });

  it('project not found โ’ 404', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.findOne(ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update project', async () => {
    prisma.project.findUnique.mockResolvedValue(dbProject());
    prisma.project.update.mockResolvedValue(dbProject({ name: 'New', teamSize: 3 }));
    const result = await service.update(ID, { name: 'New', teamSize: 3 }, user);

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: ID },
      data: expect.objectContaining({ name: 'New', teamSize: 3, startDate: undefined }),
    });
    expect(result.teamSize).toBe(3);
  });

  it('update project not found โ’ 404 เนเธฅเธฐเนเธกเนเน€เธฃเธตเธขเธ update', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.update(ID, { name: 'x' }, user)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it('update: invalid date range เน€เธกเธทเนเธญเธชเนเธเนเธเน endDate เธ—เธตเนเธเนเธญเธ startDate เน€เธ”เธดเธก', async () => {
    prisma.project.findUnique.mockResolvedValue(dbProject()); // start = 2026-01-01
    await expect(service.update(ID, { endDate: '2025-12-31' }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  it('update: invalid date range เน€เธกเธทเนเธญเธชเนเธเนเธเน startDate เธ—เธตเนเธซเธฅเธฑเธ endDate เน€เธ”เธดเธก', async () => {
    prisma.project.findUnique.mockResolvedValue(dbProject()); // end = 2026-03-01
    await expect(service.update(ID, { startDate: '2026-03-02' }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('delete project', async () => {
    prisma.project.findUnique.mockResolvedValue(dbProject());
    prisma.project.delete.mockResolvedValue(dbProject());
    await expect(service.remove(ID, user)).resolves.toEqual({ id: ID, deleted: true });
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it('delete project not found โ’ 404 เนเธฅเธฐเนเธกเนเน€เธฃเธตเธขเธ delete', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(service.remove(ID, user)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.delete).not.toHaveBeenCalled();
  });

  describe('database error', () => {
    it('เธ•เนเธญ DB เนเธกเนเนเธ”เน (P1001) โ’ 503', async () => {
      prisma.project.findMany.mockRejectedValue(
        Object.assign(new Error("Can't reach database"), { code: 'P1001' }),
      );
      prisma.project.count.mockResolvedValue(0);
      await expect(service.findAll(1, 20, user)).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('error เธญเธทเนเธเธเธฒเธ DB โ’ 500', async () => {
      prisma.project.findMany.mockRejectedValue(new Error('boom'));
      prisma.project.count.mockResolvedValue(0);
      await expect(service.findAll(1, 20, user)).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('record เธซเธฒเธขเธฃเธฐเธซเธงเนเธฒเธ update (P2025) โ’ 404', async () => {
      prisma.project.findUnique.mockResolvedValue(dbProject());
      prisma.project.update.mockRejectedValue(
        Object.assign(new Error('not found'), { code: 'P2025' }),
      );
      await expect(service.update(ID, { name: 'x' }, user)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

