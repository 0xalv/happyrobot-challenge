import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EvaluateOfferParams {
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
  // Acceptance threshold: ±8% of loadboard rate
  private readonly ACCEPTANCE_THRESHOLD = 0.08;
  private readonly MAX_ROUNDS = 3;

  async evaluateOffer(params: EvaluateOfferParams): Promise<EvaluateOfferResult> {
    const { call_id, load_id, loadboard_rate, carrier_offer, round } = params;

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
    // Rule 2: If within ±8%, accept the offer
    else if (absolutePercentageDiff <= this.ACCEPTANCE_THRESHOLD * 100) {
      action = 'ACCEPT';
      reason = `Carrier offer is within acceptable range (±${this.ACCEPTANCE_THRESHOLD * 100}% of loadboard rate). Accepting offer.`;
      console.log(`   ✅ Action: ${action} - ${reason}`);
    }
    // Rule 3: Counter-offer
    else {
      action = 'COUNTER';

      // Calculate counter-offer: move 50% towards the carrier's offer
      // This shows willingness to negotiate while protecting margins
      const midpoint = (loadboard_rate + carrier_offer) / 2;
      counter_offer = Math.round(midpoint);

      if (carrier_offer < loadboard_rate) {
        reason = `Carrier offer is ${percentageDiff.toFixed(2)}% below loadboard rate. Counter-offering at $${counter_offer}.`;
      } else {
        reason = `Carrier offer is ${percentageDiff.toFixed(2)}% above loadboard rate. Counter-offering at $${counter_offer}.`;
      }

      console.log(`   🔄 Action: ${action} - Counter offer: $${counter_offer}`);
      console.log(`   Reason: ${reason}`);
    }

    // Save negotiation round to database
    const negotiation = await prisma.negotiation.create({
      data: {
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
