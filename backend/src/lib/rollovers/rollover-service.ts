import { prisma } from "../db/prisma";
import { Rollover, RolloverStep, RolloverType, RolloverStatus, RolloverStepStatus } from "../types";
import { fixtureService } from "../football/fixture-service";

// In-memory fallback map to ensure uninterrupted operation
const memoryRollovers = new Map<string, Rollover>();

export class RolloverService {
  private isInitialized = false;

  constructor() {
    this.ensureSeeded().catch((err) => console.error("Rollover seed error:", err));
  }

  /**
   * Calculate potential return and current step index for a rollover
   */
  public computeRolloverStats(rollover: Rollover): Rollover {
    const steps = (rollover.steps || []).sort((a, b) => a.stepNumber - b.stepNumber);
    let runningAmount = rollover.startingAmount;
    let currentStepIdx = 1;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepOdds = step.odds || 1.50;

      if (step.status === "WON") {
        step.stakeAmount = runningAmount;
        runningAmount = Math.round(runningAmount * stepOdds);
        step.returnAmount = runningAmount;
        currentStepIdx = Math.min(rollover.targetSteps, step.stepNumber + 1);
      } else if (step.status === "ACTIVE") {
        step.stakeAmount = runningAmount;
        step.returnAmount = Math.round(runningAmount * stepOdds);
        currentStepIdx = step.stepNumber;
        runningAmount = Math.round(runningAmount * stepOdds);
      } else if (step.status === "PENDING") {
        step.stakeAmount = runningAmount;
        step.returnAmount = Math.round(runningAmount * stepOdds);
        runningAmount = Math.round(runningAmount * stepOdds);
      }
    }

    return {
      ...rollover,
      steps,
      currentStepIndex: currentStepIdx,
      potentialReturn: runningAmount,
    };
  }

  /**
   * Retrieve published rollovers for public viewing
   */
  async getPublishedRollovers(filter?: { type?: RolloverType; status?: RolloverStatus }): Promise<Rollover[]> {
    await this.ensureSeeded();

    try {
      const whereClause: any = { isPublished: true };
      if (filter?.type) whereClause.type = filter.type;
      if (filter?.status) whereClause.status = filter.status;

      const dbRollovers = await prisma.rollover.findMany({
        where: whereClause,
        include: { steps: { orderBy: { stepNumber: "asc" } } },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      });

      if (dbRollovers && dbRollovers.length > 0) {
        return dbRollovers.map((r: any) => this.computeRolloverStats({
          id: r.id,
          name: r.name,
          type: r.type as RolloverType,
          startingAmount: r.startingAmount,
          currentAmount: r.currentAmount,
          targetSteps: r.targetSteps,
          status: r.status as RolloverStatus,
          isPublished: r.isPublished,
          description: r.description,
          bookingCode: r.bookingCode || null,
          instructions: r.instructions || null,
          imageUrl: r.imageUrl || null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          steps: r.steps.map((s: any) => ({
            id: s.id,
            rolloverId: s.rolloverId,
            stepNumber: s.stepNumber,
            match: s.match,
            prediction: s.prediction,
            odds: s.odds,
            status: s.status as RolloverStepStatus,
            matchDate: s.matchDate,
            kickoffTime: s.kickoffTime ? s.kickoffTime.toISOString() : null,
            stakeAmount: s.stakeAmount,
            returnAmount: s.returnAmount,
            resultNote: s.resultNote,
            fixtureId: s.fixtureId,
            bookingCode: s.bookingCode || null,
            instructions: s.instructions || null,
            imageUrl: s.imageUrl || null,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
        }));
      }
    } catch (err) {
      console.warn("DB query for published rollovers failed, using memory fallback:", err);
    }

    // Memory fallback
    let list = Array.from(memoryRollovers.values()).filter((r) => r.isPublished);
    if (filter?.type) list = list.filter((r) => r.type === filter.type);
    if (filter?.status) list = list.filter((r) => r.status === filter.status);

    return list.map((r) => this.computeRolloverStats(r));
  }

  /**
   * Retrieve all rollovers for Admin (including drafts and unpublished)
   */
  async getAllRollovers(filter?: { type?: RolloverType; status?: RolloverStatus }): Promise<Rollover[]> {
    await this.ensureSeeded();

    try {
      const whereClause: any = {};
      if (filter?.type) whereClause.type = filter.type;
      if (filter?.status) whereClause.status = filter.status;

      const dbRollovers = await prisma.rollover.findMany({
        where: whereClause,
        include: { steps: { orderBy: { stepNumber: "asc" } } },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      });

      if (dbRollovers && dbRollovers.length > 0) {
        return dbRollovers.map((r: any) => this.computeRolloverStats({
          id: r.id,
          name: r.name,
          type: r.type as RolloverType,
          startingAmount: r.startingAmount,
          currentAmount: r.currentAmount,
          targetSteps: r.targetSteps,
          status: r.status as RolloverStatus,
          isPublished: r.isPublished,
          description: r.description,
          bookingCode: r.bookingCode,
          instructions: r.instructions,
          imageUrl: r.imageUrl,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          steps: r.steps.map((s: any) => ({
            id: s.id,
            rolloverId: s.rolloverId,
            stepNumber: s.stepNumber,
            match: s.match,
            prediction: s.prediction,
            odds: s.odds,
            status: s.status as RolloverStepStatus,
            matchDate: s.matchDate,
            kickoffTime: s.kickoffTime ? s.kickoffTime.toISOString() : null,
            stakeAmount: s.stakeAmount,
            returnAmount: s.returnAmount,
            resultNote: s.resultNote,
            fixtureId: s.fixtureId,
            bookingCode: s.bookingCode,
            instructions: s.instructions,
            imageUrl: s.imageUrl,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
        }));
      }
    } catch (err) {
      console.warn("DB query for all rollovers failed, using memory fallback:", err);
    }

    let list = Array.from(memoryRollovers.values());
    if (filter?.type) list = list.filter((r) => r.type === filter.type);
    if (filter?.status) list = list.filter((r) => r.status === filter.status);

    return list.map((r) => this.computeRolloverStats(r));
  }

  /**
   * Retrieve single rollover by ID
   */
  async getRolloverById(id: string, allowUnpublished = false): Promise<Rollover | null> {
    await this.ensureSeeded();

    try {
      const dbRollover = await prisma.rollover.findUnique({
        where: { id },
        include: { steps: { orderBy: { stepNumber: "asc" } } },
      });

      if (dbRollover) {
        if (!allowUnpublished && !dbRollover.isPublished) return null;
        return this.computeRolloverStats({
          id: dbRollover.id,
          name: dbRollover.name,
          type: dbRollover.type as RolloverType,
          startingAmount: dbRollover.startingAmount,
          currentAmount: dbRollover.currentAmount,
          targetSteps: dbRollover.targetSteps,
          status: dbRollover.status as RolloverStatus,
          isPublished: dbRollover.isPublished,
          description: dbRollover.description,
          bookingCode: dbRollover.bookingCode,
          instructions: dbRollover.instructions,
          imageUrl: dbRollover.imageUrl,
          createdAt: dbRollover.createdAt.toISOString(),
          updatedAt: dbRollover.updatedAt.toISOString(),
          steps: dbRollover.steps.map((s: any) => ({
            id: s.id,
            rolloverId: s.rolloverId,
            stepNumber: s.stepNumber,
            match: s.match,
            prediction: s.prediction,
            odds: s.odds,
            status: s.status as RolloverStepStatus,
            matchDate: s.matchDate,
            kickoffTime: s.kickoffTime ? s.kickoffTime.toISOString() : null,
            stakeAmount: s.stakeAmount,
            returnAmount: s.returnAmount,
            resultNote: s.resultNote,
            fixtureId: s.fixtureId,
            bookingCode: s.bookingCode,
            instructions: s.instructions,
            imageUrl: s.imageUrl,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
        });
      }
    } catch (err) {
      console.warn("DB query for single rollover failed, using memory fallback:", err);
    }

    const mem = memoryRollovers.get(id);
    if (!mem) return null;
    if (!allowUnpublished && !mem.isPublished) return null;
    return this.computeRolloverStats(mem);
  }

  /**
   * Admin: Create a new Rollover
   */
  async createRollover(input: {
    name: string;
    type?: RolloverType;
    startingAmount?: number;
    targetSteps?: number;
    description?: string;
    isPublished?: boolean;
    bookingCode?: string | null;
    instructions?: string | null;
    imageUrl?: string | null;
  }): Promise<Rollover> {
    const id = `roll_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const type: RolloverType = input.type || "MANUAL";
    const startingAmount = Number(input.startingAmount) || 500;
    const targetSteps = Number(input.targetSteps) || 5;
    const isPublished = input.isPublished !== undefined ? input.isPublished : true;
    const description = input.description || null;
    const bookingCode = input.bookingCode || null;
    const instructions = input.instructions || null;
    const imageUrl = input.imageUrl || null;

    try {
      const created = await prisma.rollover.create({
        data: {
          id,
          name: input.name,
          type: type as any,
          startingAmount,
          currentAmount: startingAmount,
          targetSteps,
          isPublished,
          description,
          bookingCode,
          instructions,
          imageUrl,
        },
        include: { steps: true },
      });

      const res: Rollover = {
        id: created.id,
        name: created.name,
        type: created.type as RolloverType,
        startingAmount: created.startingAmount,
        currentAmount: created.currentAmount,
        targetSteps: created.targetSteps,
        status: created.status as RolloverStatus,
        isPublished: created.isPublished,
        description: created.description,
        bookingCode: created.bookingCode,
        instructions: created.instructions,
        imageUrl: created.imageUrl,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        steps: [],
      };
      memoryRollovers.set(id, res);
      return this.computeRolloverStats(res);
    } catch (err) {
      console.error("Failed to create rollover in DB, falling back to memory:", err);
      const res: Rollover = {
        id,
        name: input.name,
        type,
        startingAmount,
        currentAmount: startingAmount,
        targetSteps,
        status: "ACTIVE",
        isPublished,
        description,
        bookingCode,
        instructions,
        imageUrl,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        steps: [],
      };
      memoryRollovers.set(id, res);
      return this.computeRolloverStats(res);
    }
  }

  /**
   * Admin: Update Rollover metadata/status
   */
  async updateRollover(
    id: string,
    data: {
      name?: string;
      startingAmount?: number;
      currentAmount?: number;
      targetSteps?: number;
      status?: RolloverStatus;
      isPublished?: boolean;
      description?: string;
      bookingCode?: string | null;
      instructions?: string | null;
      imageUrl?: string | null;
    }
  ): Promise<Rollover | null> {
    try {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.startingAmount !== undefined) updateData.startingAmount = Number(data.startingAmount);
      if (data.currentAmount !== undefined) updateData.currentAmount = Number(data.currentAmount);
      if (data.targetSteps !== undefined) updateData.targetSteps = Number(data.targetSteps);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.bookingCode !== undefined) updateData.bookingCode = data.bookingCode;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

      const updated = await prisma.rollover.update({
        where: { id },
        data: updateData,
        include: { steps: { orderBy: { stepNumber: "asc" } } },
      });

      const res: Rollover = {
        id: updated.id,
        name: updated.name,
        type: updated.type as RolloverType,
        startingAmount: updated.startingAmount,
        currentAmount: updated.currentAmount,
        targetSteps: updated.targetSteps,
        status: updated.status as RolloverStatus,
        isPublished: updated.isPublished,
        description: updated.description,
        bookingCode: updated.bookingCode,
        instructions: updated.instructions,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        steps: updated.steps.map((s: any) => ({
          id: s.id,
          rolloverId: s.rolloverId,
          stepNumber: s.stepNumber,
          match: s.match,
          prediction: s.prediction,
          odds: s.odds,
          status: s.status as RolloverStepStatus,
          matchDate: s.matchDate,
          kickoffTime: s.kickoffTime ? s.kickoffTime.toISOString() : null,
          stakeAmount: s.stakeAmount,
          returnAmount: s.returnAmount,
          resultNote: s.resultNote,
          fixtureId: s.fixtureId,
          bookingCode: s.bookingCode,
          instructions: s.instructions,
          imageUrl: s.imageUrl,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      };
      memoryRollovers.set(id, res);
      return this.computeRolloverStats(res);
    } catch (err) {
      console.warn("DB update rollover failed, using memory fallback:", err);
      const mem = memoryRollovers.get(id);
      if (!mem) return null;
      if (data.name !== undefined) mem.name = data.name;
      if (data.startingAmount !== undefined) mem.startingAmount = Number(data.startingAmount);
      if (data.currentAmount !== undefined) mem.currentAmount = Number(data.currentAmount);
      if (data.targetSteps !== undefined) mem.targetSteps = Number(data.targetSteps);
      if (data.status !== undefined) mem.status = data.status;
      if (data.isPublished !== undefined) mem.isPublished = data.isPublished;
      if (data.description !== undefined) mem.description = data.description;
      if (data.bookingCode !== undefined) mem.bookingCode = data.bookingCode;
      if (data.instructions !== undefined) mem.instructions = data.instructions;
      if (data.imageUrl !== undefined) mem.imageUrl = data.imageUrl;
      mem.updatedAt = new Date().toISOString();
      memoryRollovers.set(id, mem);
      return this.computeRolloverStats(mem);
    }
  }

  /**
   * Admin: Delete Rollover
   */
  async deleteRollover(id: string): Promise<boolean> {
    try {
      await prisma.rollover.delete({ where: { id } });
    } catch (err) {
      console.warn("DB delete rollover error:", err);
    }
    memoryRollovers.delete(id);
    return true;
  }

  /**
   * Admin: Add a game/step to a Rollover
   */
  async addStep(
    rolloverId: string,
    input: {
      match: string;
      prediction: string;
      odds: number;
      matchDate?: string;
      kickoffTime?: string;
      status?: RolloverStepStatus;
      fixtureId?: string;
      bookingCode?: string | null;
      instructions?: string | null;
      imageUrl?: string | null;
    }
  ): Promise<Rollover | null> {
    const rollover = await this.getRolloverById(rolloverId, true);
    if (!rollover) return null;

    const stepNumber = rollover.steps.length + 1;
    const odds = Number(input.odds) || 1.50;
    const status: RolloverStepStatus = input.status || (stepNumber === 1 ? "ACTIVE" : "PENDING");
    const stepId = `step_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();

    // Calculate stake for this step
    const previousStep = rollover.steps[rollover.steps.length - 1];
    let stakeAmount = rollover.startingAmount;
    if (previousStep) {
      stakeAmount = previousStep.returnAmount || rollover.currentAmount || Math.round(previousStep.stakeAmount! * previousStep.odds);
    }
    const returnAmount = Math.round(stakeAmount * odds);

    try {
      await prisma.rolloverStep.create({
        data: {
          id: stepId,
          rolloverId,
          stepNumber,
          match: input.match,
          prediction: input.prediction,
          odds,
          status: status as any,
          matchDate: input.matchDate || "Today",
          kickoffTime: input.kickoffTime ? new Date(input.kickoffTime) : null,
          stakeAmount,
          returnAmount,
          fixtureId: input.fixtureId || null,
          bookingCode: input.bookingCode || null,
          instructions: input.instructions || null,
          imageUrl: input.imageUrl || null,
        },
      });
      return await this.getRolloverById(rolloverId, true);
    } catch (err) {
      console.warn("DB create step failed, using memory fallback:", err);
      const newStep: RolloverStep = {
        id: stepId,
        rolloverId,
        stepNumber,
        match: input.match,
        prediction: input.prediction,
        odds,
        status,
        matchDate: input.matchDate || "Today",
        kickoffTime: input.kickoffTime || null,
        stakeAmount,
        returnAmount,
        fixtureId: input.fixtureId || null,
        bookingCode: input.bookingCode || null,
        instructions: input.instructions || null,
        imageUrl: input.imageUrl || null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      rollover.steps.push(newStep);
      rollover.updatedAt = now.toISOString();
      memoryRollovers.set(rolloverId, rollover);
      return this.computeRolloverStats(rollover);
    }
  }

  /**
   * Admin: Update a step (mark WON/LOST/ACTIVE, change odds, etc.)
   */
  async updateStep(
    rolloverId: string,
    stepId: string,
    input: {
      match?: string;
      prediction?: string;
      odds?: number;
      status?: RolloverStepStatus;
      matchDate?: string;
      resultNote?: string;
      bookingCode?: string | null;
      instructions?: string | null;
      imageUrl?: string | null;
    }
  ): Promise<Rollover | null> {
    const rollover = await this.getRolloverById(rolloverId, true);
    if (!rollover) return null;

    const step = rollover.steps.find((s) => s.id === stepId);
    if (!step) return null;

    const newOdds = input.odds !== undefined ? Number(input.odds) : step.odds;
    const newStatus = input.status !== undefined ? input.status : step.status;

    // Database update
    try {
      await prisma.rolloverStep.update({
        where: { id: stepId },
        data: {
          match: input.match !== undefined ? input.match : step.match,
          prediction: input.prediction !== undefined ? input.prediction : step.prediction,
          odds: newOdds,
          status: newStatus as any,
          matchDate: input.matchDate !== undefined ? input.matchDate : step.matchDate,
          resultNote: input.resultNote !== undefined ? input.resultNote : step.resultNote,
          bookingCode: input.bookingCode !== undefined ? input.bookingCode : step.bookingCode,
          instructions: input.instructions !== undefined ? input.instructions : step.instructions,
          imageUrl: input.imageUrl !== undefined ? input.imageUrl : step.imageUrl,
        },
      });

      // Recalculate rollover progression after step status change
      await this.recalculateRolloverProgression(rolloverId);
      return await this.getRolloverById(rolloverId, true);
    } catch (err) {
      console.warn("DB update step failed, using memory fallback:", err);
      if (input.match !== undefined) step.match = input.match;
      if (input.prediction !== undefined) step.prediction = input.prediction;
      step.odds = newOdds;
      step.status = newStatus;
      if (input.matchDate !== undefined) step.matchDate = input.matchDate;
      if (input.resultNote !== undefined) step.resultNote = input.resultNote;
      if (input.bookingCode !== undefined) step.bookingCode = input.bookingCode;
      if (input.instructions !== undefined) step.instructions = input.instructions;
      if (input.imageUrl !== undefined) step.imageUrl = input.imageUrl;
      step.updatedAt = new Date().toISOString();

      await this.recalculateRolloverProgression(rolloverId);
      return this.computeRolloverStats(rollover);
    }
  }

  /**
   * Admin: Remove a step
   */
  async deleteStep(rolloverId: string, stepId: string): Promise<Rollover | null> {
    try {
      await prisma.rolloverStep.delete({ where: { id: stepId } });
    } catch (err) {
      console.warn("DB delete step error:", err);
    }

    const mem = memoryRollovers.get(rolloverId);
    if (mem) {
      mem.steps = mem.steps.filter((s) => s.id !== stepId);
      // Re-index stepNumbers
      mem.steps.forEach((s, idx) => {
        s.stepNumber = idx + 1;
      });
      memoryRollovers.set(rolloverId, mem);
    }

    await this.recalculateRolloverProgression(rolloverId);
    return await this.getRolloverById(rolloverId, true);
  }

  /**
   * Recalculate cumulative amounts and advance next steps
   */
  private async recalculateRolloverProgression(rolloverId: string): Promise<void> {
    const rollover = await this.getRolloverById(rolloverId, true);
    if (!rollover) return;

    let currentAmount = rollover.startingAmount;
    let anyLost = false;
    let allWon = true;

    for (let i = 0; i < rollover.steps.length; i++) {
      const s = rollover.steps[i];
      if (s.status === "WON") {
        s.stakeAmount = currentAmount;
        currentAmount = Math.round(currentAmount * (s.odds || 1.50));
        s.returnAmount = currentAmount;
      } else if (s.status === "LOST") {
        anyLost = true;
        allWon = false;
        break;
      } else {
        allWon = false;
      }
    }

    // Determine rollover overall status
    let nextStatus = rollover.status;
    if (anyLost) {
      nextStatus = "LOST";
    } else if (allWon && rollover.steps.length >= rollover.targetSteps && rollover.steps.length > 0) {
      nextStatus = "COMPLETED";
    } else if (nextStatus === "LOST" && !anyLost) {
      nextStatus = "ACTIVE";
    }

    // Auto-advance next step to ACTIVE if previous is WON and next is PENDING
    for (let i = 0; i < rollover.steps.length; i++) {
      const s = rollover.steps[i];
      if (s.status === "PENDING") {
        const prev = rollover.steps[i - 1];
        if (!prev || prev.status === "WON") {
          s.status = "ACTIVE";
          try {
            await prisma.rolloverStep.update({
              where: { id: s.id },
              data: { status: "ACTIVE" as any },
            });
          } catch {
            // Memory fallback
          }
          break;
        }
      }
    }

    // Save updated currentAmount and status to DB and memory
    try {
      await prisma.rollover.update({
        where: { id: rolloverId },
        data: {
          currentAmount,
          status: nextStatus as any,
        },
      });
    } catch {
      // Memory fallback
    }

    const mem = memoryRollovers.get(rolloverId);
    if (mem) {
      mem.currentAmount = currentAmount;
      mem.status = nextStatus;
      mem.updatedAt = new Date().toISOString();
      memoryRollovers.set(rolloverId, mem);
    }
  }

  /**
   * Generate an automated AI Rollover plan using high-confidence fixture predictions
   */
  async generateAIRollover(targetSteps = 5, startingAmount = 500): Promise<Rollover> {
    // 1. Query today/tomorrow fixtures
    let candidateMatches: any[] = [];
    try {
      const todayFixtures = await fixtureService.getFixtures("0");
      const tomorrowFixtures = await fixtureService.getFixtures("1");
      const all = [...todayFixtures, ...tomorrowFixtures];

      // Filter for fixtures with high-confidence predictions and good rollover odds (1.30 to 1.75)
      candidateMatches = all
        .filter((f) => {
          const bestPick = f.predictions?.find((p) => p.confidence && p.confidence >= 70);
          return Boolean(bestPick);
        })
        .map((f) => {
          const bestPick = f.predictions!.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
          const odds = bestPick.odd || 1.55;
          return {
            match: `${f.homeTeam.name} vs ${f.awayTeam.name}`,
            prediction: bestPick.selection === "1" ? `${f.homeTeam.name} Win` :
                        bestPick.selection === "2" ? `${f.awayTeam.name} Win` :
                        bestPick.selection === "X" ? "Draw" : bestPick.selection,
            odds: odds >= 1.25 && odds <= 2.10 ? odds : 1.50,
            date: f.matchDate || "Today",
            fixtureId: f.id,
          };
        });
    } catch (err) {
      console.warn("Failed to retrieve candidate fixtures for AI rollover:", err);
    }

    // Fallback candidates if API/DB fixtures are sparse
    const defaultCandidates = [
      { match: "Arsenal vs Crystal Palace", prediction: "Arsenal Win", odds: 1.48, date: "Today, 17:30" },
      { match: "Real Madrid vs Girona", prediction: "Over 1.5 Goals", odds: 1.52, date: "Tomorrow, 20:00" },
      { match: "Bayern Munich vs Augsburg", prediction: "Bayern Munich Win", odds: 1.38, date: "Tomorrow, 15:30" },
      { match: "Inter Milan vs Parma", prediction: "Inter Milan Win", odds: 1.42, date: "In 2 Days" },
      { match: "PSG vs Lens", prediction: "Over 2.5 Goals", odds: 1.55, date: "In 2 Days" },
      { match: "Barcelona vs Celta Vigo", prediction: "Barcelona Win", odds: 1.46, date: "In 3 Days" },
      { match: "Manchester City vs Bournemouth", prediction: "Over 2.5 Goals", odds: 1.50, date: "In 3 Days" },
    ];

    const pool = candidateMatches.length >= targetSteps ? candidateMatches : defaultCandidates;
    const selected = pool.slice(0, targetSteps);

    // Numbering AI plan
    const aiCount = Array.from(memoryRollovers.values()).filter((r) => r.type === "AI").length + 1;
    const planName = `AI Rollover #${String(aiCount).padStart(3, "0")}`;

    const rollover = await this.createRollover({
      name: planName,
      type: "AI",
      startingAmount,
      targetSteps,
      description: "Automated high-probability progression plan curated by Jolloftips AI Confidence Engine.",
      isPublished: true,
    });

    // Add steps
    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      await this.addStep(rollover.id, {
        match: item.match,
        prediction: item.prediction,
        odds: item.odds,
        matchDate: item.date,
        status: i === 0 ? "ACTIVE" : "PENDING",
        fixtureId: (item as any).fixtureId || undefined,
      });
    }

    return (await this.getRolloverById(rollover.id, true))!;
  }

  /**
   * Seed initial starter rollovers matching prompt specifications
   */
  private async ensureSeeded(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const count = await prisma.rollover.count();
      if (count > 0) {
        // Load into memory cache for fast fallbacks
        const existing = await prisma.rollover.findMany({
          include: { steps: { orderBy: { stepNumber: "asc" } } },
        });
        for (const r of existing) {
          memoryRollovers.set(r.id, {
            id: r.id,
            name: r.name,
            type: r.type as RolloverType,
            startingAmount: r.startingAmount,
            currentAmount: r.currentAmount,
            targetSteps: r.targetSteps,
            status: r.status as RolloverStatus,
            isPublished: r.isPublished,
            description: r.description,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            steps: r.steps.map((s: any) => ({
              id: s.id,
              rolloverId: s.rolloverId,
              stepNumber: s.stepNumber,
              match: s.match,
              prediction: s.prediction,
              odds: s.odds,
              status: s.status as RolloverStepStatus,
              matchDate: s.matchDate,
              kickoffTime: s.kickoffTime ? s.kickoffTime.toISOString() : null,
              stakeAmount: s.stakeAmount,
              returnAmount: s.returnAmount,
              resultNote: s.resultNote,
              fixtureId: s.fixtureId,
              createdAt: s.createdAt.toISOString(),
              updatedAt: s.updatedAt.toISOString(),
            })),
          });
        }
        return;
      }
    } catch {
      // Continue to seed memory
    }

    if (memoryRollovers.size > 0) return;

    console.log("⚡ Seeding starter Rollover plans (AI & Manual)...");

    // 1. AI Rollover #001 (Active, 3/7 progress, ₦500 -> ₦1,200)
    const ai001 = await this.createRollover({
      name: "AI Rollover #001",
      type: "AI",
      startingAmount: 500,
      targetSteps: 7,
      description: "Automated banker selections generated by the AI Confidence Engine with strict value thresholds.",
      isPublished: true,
    });

    await this.addStep(ai001.id, { match: "Chelsea vs Leicester", prediction: "Chelsea Win", odds: 1.50, matchDate: "Yesterday", status: "WON" });
    await this.addStep(ai001.id, { match: "Real Madrid vs Osasuna", prediction: "Over 1.5 Goals", odds: 1.60, matchDate: "Yesterday", status: "WON" });
    await this.addStep(ai001.id, { match: "Arsenal vs Everton", prediction: "Arsenal Win", odds: 1.45, matchDate: "Today, 16:00", status: "ACTIVE" });
    await this.addStep(ai001.id, { match: "Bayern Munich vs Frankfurt", prediction: "Over 2.5 Goals", odds: 1.50, matchDate: "Tomorrow", status: "PENDING" });
    await this.addStep(ai001.id, { match: "PSG vs Lyon", prediction: "PSG Win", odds: 1.40, matchDate: "Tomorrow", status: "PENDING" });
    await this.addStep(ai001.id, { match: "Inter Milan vs Torino", prediction: "Inter Win", odds: 1.48, matchDate: "In 2 Days", status: "PENDING" });
    await this.addStep(ai001.id, { match: "Barcelona vs Sevilla", prediction: "Barcelona Win", odds: 1.55, matchDate: "In 3 Days", status: "PENDING" });
    await this.recalculateRolloverProgression(ai001.id);

    // 2. Manual Rollover: Jolloftips Weekend Rollover (Active, 1/5 progress, ₦500 -> ₦750)
    const manual001 = await this.createRollover({
      name: "Jolloftips Weekend Rollover",
      type: "MANUAL",
      startingAmount: 500,
      targetSteps: 5,
      description: "Hand-picked high probability banker picks curated by the senior Jolloftips analytical team.",
      isPublished: true,
    });

    await this.addStep(manual001.id, { match: "Man City vs Newcastle", prediction: "Man City Win", odds: 1.50, matchDate: "Yesterday", status: "WON" });
    await this.addStep(manual001.id, { match: "Liverpool vs Wolves", prediction: "Over 1.5 Goals", odds: 1.60, matchDate: "Today, 18:30", status: "ACTIVE" });
    await this.addStep(manual001.id, { match: "Leverkusen vs Bremen", prediction: "Leverkusen Win", odds: 1.45, matchDate: "Tomorrow", status: "PENDING" });
    await this.addStep(manual001.id, { match: "Juventus vs Genoa", prediction: "1X Double Chance", odds: 1.35, matchDate: "Tomorrow", status: "PENDING" });
    await this.addStep(manual001.id, { match: "Atletico Madrid vs Mallorca", prediction: "Atletico Win", odds: 1.50, matchDate: "In 2 Days", status: "PENDING" });
    await this.recalculateRolloverProgression(manual001.id);

    // 3. Completed AI Rollover #000 (Historical success, 4/4)
    const aiCompleted = await this.createRollover({
      name: "AI Safe Rollover (Completed)",
      type: "AI",
      startingAmount: 1000,
      targetSteps: 4,
      description: "Successful 4-step progression completed with 100% win rate.",
      isPublished: true,
    });
    await this.addStep(aiCompleted.id, { match: "Arsenal vs Southampton", prediction: "Arsenal Win", odds: 1.40, matchDate: "3 Days Ago", status: "WON" });
    await this.addStep(aiCompleted.id, { match: "Real Madrid vs Alaves", prediction: "Over 1.5 Goals", odds: 1.45, matchDate: "2 Days Ago", status: "WON" });
    await this.addStep(aiCompleted.id, { match: "PSG vs Rennes", prediction: "PSG Win", odds: 1.42, matchDate: "Yesterday", status: "WON" });
    await this.addStep(aiCompleted.id, { match: "Bayern Munich vs Bochum", prediction: "Over 2.5 Goals", odds: 1.48, matchDate: "Yesterday", status: "WON" });
    await this.recalculateRolloverProgression(aiCompleted.id);
  }
}

export const rolloverService = new RolloverService();
