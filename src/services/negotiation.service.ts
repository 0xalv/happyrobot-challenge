import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EvaluateOfferParams {
  run_id?: string;
  call_id?: string;
  load_id: string;
  loadboard_rate: number;
  carrier_offer: number;
  round: number;
}

export interface EvaluateOfferResult {
  action: 'ACCEPT' | 'COUNTER' | 'TRANSFER';
  counter_offer?: number;
  reason: string;
  negotiation_id: string;
}

export class NegotiationService {
  // Acceptance threshold: up to 8% above loadboard rate
  private readonly ACCEPTANCE_THRESHOLD = 0.08;
  private readonly MAX_ROUNDS = 3;

  // Progressive counter-offer percentages by round
  // Round 1: offer +3%, Round 2: offer +5.5%, Round 3: transfer
  private readonly COUNTER_PERCENTAGES = [0.03, 0.055];

  async evaluateOffer(params: EvaluateOfferParams): Promise<EvaluateOfferResult> {
    const { run_id, call_id, load_id, loadboard_rate, carrier_offer, round } = params;

    console.log(`💰 Evaluating offer for ${load_id}:`);
    console.log(`   Loadboard rate: $${loadboard_rate}`);
    console.log(`   Carrier offer: $${carrier_offer}`);
    console.log(`   Round: ${round}`);

    // Calculate percentage difference
    const difference = carrier_offer - loadboard_rate;
    const percentageDiff = (difference / loadboard_rate) * 100;
    const absolutePercentageDiff = Math.abs(percentageDiff);

    console.log(`   Difference: $${difference.toFixed(2)} (${percentageDiff.toFixed(2)}%)`);

    // Determine action
    let action: 'ACCEPT' | 'COUNTER' | 'TRANSFER';
    let counter_offer: number | undefined;
    let reason: string;

    // Rule 1: If round >= 3, transfer to sales rep
    if (round >= this.MAX_ROUNDS) {
      action = 'TRANSFER';
      reason = `Maximum negotiation rounds (${this.MAX_ROUNDS}) reached. Transferring to sales representative.`;
      console.log(`   ⚠️ Action: ${action} - ${reason}`);
    }
    // Rule 2: Accept if carrier asks for loadboard_rate or less, OR up to 8% above loadboard_rate
    else if (carrier_offer <= loadboard_rate * (1 + this.ACCEPTANCE_THRESHOLD)) {
      action = 'ACCEPT';
      if (carrier_offer < loadboard_rate) {
        reason = `Carrier offer ($${carrier_offer}) is ${Math.abs(percentageDiff).toFixed(2)}% below loadboard rate ($${loadboard_rate}). Excellent deal - accepting immediately.`;
      } else if (carrier_offer === loadboard_rate) {
        reason = `Carrier offer ($${carrier_offer}) matches loadboard rate exactly. Accepting offer.`;
      } else {
        reason = `Carrier offer is ${percentageDiff.toFixed(2)}% above loadboard rate, within acceptable range (+${this.ACCEPTANCE_THRESHOLD * 100}%). Accepting offer.`;
      }
      console.log(`   ✅ Action: ${action} - ${reason}`);
    }
    // Rule 3: Counter-offer if carrier asks for more than 8% above loadboard_rate
    else {
      action = 'COUNTER';

      // Progressive counter-offer strategy:
      // Round 1: offer loadboard_rate + 3%
      // Round 2: offer loadboard_rate + 5.5%
      // Round 3+: would transfer (handled by Rule 1)
      const counterPercentage = this.COUNTER_PERCENTAGES[round - 1] || this.COUNTER_PERCENTAGES[this.COUNTER_PERCENTAGES.length - 1];
      counter_offer = Math.round(loadboard_rate * (1 + counterPercentage));

      const counterPercentDisplay = (counterPercentage * 100).toFixed(1);
      reason = `Carrier offer is ${percentageDiff.toFixed(2)}% above loadboard rate (max acceptable is +${this.ACCEPTANCE_THRESHOLD * 100}%). Counter-offering at $${counter_offer} (+${counterPercentDisplay}% of loadboard rate).`;

      console.log(`   🔄 Action: ${action} - Counter offer: $${counter_offer} (Round ${round}: +${counterPercentDisplay}%)`);
      console.log(`   Reason: ${reason}`);
    }

    // Save negotiation round to database
    const negotiation = await prisma.negotiation.create({
      data: {
        run_id: run_id || null,
        call_id: call_id || null,
        load_id,
        round,
        carrier_offer,
        counter_offer: counter_offer || null,
        action,
        reason,
      },
    });

    console.log(`   💾 Saved negotiation: ${negotiation.id}`);

    return {
      action,
      counter_offer,
      reason,
      negotiation_id: negotiation.id,
    };
  }

  // Get negotiation history for a call
  async getNegotiationHistory(call_id: string) {
    console.log(`📜 Fetching negotiation history for call: ${call_id}`);

    const negotiations = await prisma.negotiation.findMany({
      where: { call_id },
      orderBy: { round: 'asc' },
      include: {
        load: true,
      },
    });

    console.log(`   Found ${negotiations.length} negotiation rounds`);
    return negotiations;
  }

  // Get all negotiations for a load
  async getNegotiationsByLoad(load_id: string) {
    console.log(`📜 Fetching negotiations for load: ${load_id}`);

    const negotiations = await prisma.negotiation.findMany({
      where: { load_id },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Found ${negotiations.length} negotiations`);
    return negotiations;
  }
}

export const negotiationService = new NegotiationService();
