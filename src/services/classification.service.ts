// Classification Service - Classifies call outcomes based on call data

export type CallOutcome = 'BOOKED' | 'NOT_INTERESTED' | 'TRANSFERRED' | 'NO_MATCH' | 'ERROR';

export interface ClassificationInput {
  transcript?: string;
  load_id?: string;
  final_price?: number;
  mc_number?: string;
  call_duration?: number;
}

export interface ClassificationResult {
  outcome: CallOutcome;
  outcome_reason: string;
  confidence: number; // 0.0 to 1.0
}

export class ClassificationService {
  /**
   * Classifies call outcome based on available data
   * Uses rule-based logic to determine outcome
   */
  classifyOutcome(input: ClassificationInput): ClassificationResult {
    console.log('🎯 Classifying call outcome...');
    console.log(`   Input: load_id=${input.load_id}, final_price=${input.final_price}, mc_number=${input.mc_number}`);

    // Rule 1: If final_price is set and load_id exists → BOOKED
    if (input.final_price && input.load_id) {
      const reason = `Load ${input.load_id} booked at $${input.final_price}`;
      console.log(`   ✅ Outcome: BOOKED - ${reason}`);
      return {
        outcome: 'BOOKED',
        outcome_reason: reason,
        confidence: 0.95,
      };
    }

    // Rule 2: If transcript contains "transfer" keywords → TRANSFERRED
    if (input.transcript) {
      const transferKeywords = ['transfer', 'sales rep', 'specialist', 'human', 'speak to someone'];
      const lowerTranscript = input.transcript.toLowerCase();

      if (transferKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        const reason = 'Call transferred to sales representative';
        console.log(`   🔄 Outcome: TRANSFERRED - ${reason}`);
        return {
          outcome: 'TRANSFERRED',
          outcome_reason: reason,
          confidence: 0.90,
        };
      }
    }

    // Rule 3: If no MC number verification → ERROR
    if (!input.mc_number) {
      const reason = 'Carrier MC number not verified';
      console.log(`   ❌ Outcome: ERROR - ${reason}`);
      return {
        outcome: 'ERROR',
        outcome_reason: reason,
        confidence: 0.85,
      };
    }

    // Rule 4: Check for "not interested" signals in transcript
    if (input.transcript) {
      const notInterestedKeywords = [
        'not interested',
        'no thanks',
        'not right now',
        'looking for something else',
        'different route',
        'too far',
        'rate too low'
      ];
      const lowerTranscript = input.transcript.toLowerCase();

      if (notInterestedKeywords.some(keyword => lowerTranscript.includes(keyword))) {
        const reason = 'Carrier declined the load offer';
        console.log(`   ❌ Outcome: NOT_INTERESTED - ${reason}`);
        return {
          outcome: 'NOT_INTERESTED',
          outcome_reason: reason,
          confidence: 0.88,
        };
      }
    }

    // Rule 5: If load_id is missing but carrier verified → NO_MATCH
    if (!input.load_id && input.mc_number) {
      const reason = 'No suitable loads found for carrier requirements';
      console.log(`   ⚠️ Outcome: NO_MATCH - ${reason}`);
      return {
        outcome: 'NO_MATCH',
        outcome_reason: reason,
        confidence: 0.80,
      };
    }

    // Rule 6: Short call duration (< 30 seconds) → likely ERROR or dropped
    if (input.call_duration && input.call_duration < 30) {
      const reason = `Call too short (${input.call_duration}s) - likely disconnected`;
      console.log(`   ❌ Outcome: ERROR - ${reason}`);
      return {
        outcome: 'ERROR',
        outcome_reason: reason,
        confidence: 0.75,
      };
    }

    // Default: NOT_INTERESTED (conservative default)
    const reason = 'Call completed without booking - carrier not interested';
    console.log(`   ❌ Outcome: NOT_INTERESTED (default) - ${reason}`);
    return {
      outcome: 'NOT_INTERESTED',
      outcome_reason: reason,
      confidence: 0.70,
    };
  }

  /**
   * Get outcome statistics
   */
  getOutcomeStats() {
    return {
      outcomes: ['BOOKED', 'NOT_INTERESTED', 'TRANSFERRED', 'NO_MATCH', 'ERROR'],
      descriptions: {
        BOOKED: 'Load successfully booked with carrier',
        NOT_INTERESTED: 'Carrier declined the load offer',
        TRANSFERRED: 'Call transferred to human sales representative',
        NO_MATCH: 'No suitable loads found for carrier',
        ERROR: 'Call error or verification failure',
      },
    };
  }
}

export const classificationService = new ClassificationService();
