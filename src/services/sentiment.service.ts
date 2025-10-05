// Sentiment Analysis Service - Analyzes carrier sentiment from call data

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface SentimentAnalysisInput {
  transcript?: string;
  outcome?: string;
  call_duration?: number;
}

export interface SentimentAnalysisResult {
  sentiment: Sentiment;
  sentiment_score: number; // 0.0 (very negative) to 1.0 (very positive)
  indicators: string[];
}

export class SentimentService {
  // Positive sentiment indicators
  private positiveKeywords = [
    'great', 'perfect', 'excellent', 'thank you', 'thanks', 'appreciate',
    'sounds good', 'deal', 'yes', 'sure', 'absolutely', 'fantastic',
    'wonderful', 'good', 'nice', 'happy', 'glad', 'love', 'awesome'
  ];

  // Negative sentiment indicators
  private negativeKeywords = [
    'no', 'not interested', 'can\'t', 'won\'t', 'never', 'bad', 'terrible',
    'disappointed', 'frustrated', 'angry', 'upset', 'problem', 'issue',
    'wrong', 'too low', 'too far', 'waste', 'ridiculous', 'unacceptable'
  ];

  // Neutral indicators
  private neutralKeywords = [
    'maybe', 'think about', 'consider', 'let me', 'call back', 'later',
    'not sure', 'possibly', 'perhaps', 'okay', 'alright', 'fine'
  ];

  /**
   * Analyzes sentiment from call data
   * Uses keyword matching and outcome-based scoring
   */
  analyzeSentiment(input: SentimentAnalysisInput): SentimentAnalysisResult {
    console.log('😊 Analyzing carrier sentiment...');

    let score = 0.5; // Start neutral
    const indicators: string[] = [];

    // Factor 1: Outcome-based baseline
    if (input.outcome === 'BOOKED') {
      score += 0.3;
      indicators.push('Load booked (positive outcome)');
    } else if (input.outcome === 'NOT_INTERESTED') {
      score -= 0.2;
      indicators.push('Declined offer (negative signal)');
    } else if (input.outcome === 'TRANSFERRED') {
      score += 0.0; // Neutral - could go either way
      indicators.push('Transferred to sales (neutral)');
    } else if (input.outcome === 'NO_MATCH') {
      score -= 0.1;
      indicators.push('No suitable loads (slight negative)');
    } else if (input.outcome === 'ERROR') {
      score -= 0.2;
      indicators.push('Call error (negative)');
    }

    // Factor 2: Transcript keyword analysis
    if (input.transcript) {
      const lowerTranscript = input.transcript.toLowerCase();

      // Count positive keywords
      const positiveCount = this.positiveKeywords.filter(kw =>
        lowerTranscript.includes(kw)
      ).length;

      // Count negative keywords
      const negativeCount = this.negativeKeywords.filter(kw =>
        lowerTranscript.includes(kw)
      ).length;

      // Count neutral keywords
      const neutralCount = this.neutralKeywords.filter(kw =>
        lowerTranscript.includes(kw)
      ).length;

      console.log(`   Keywords: +${positiveCount} positive, -${negativeCount} negative, ±${neutralCount} neutral`);

      // Adjust score based on keyword balance
      if (positiveCount > 0) {
        const boost = Math.min(0.3, positiveCount * 0.1);
        score += boost;
        indicators.push(`${positiveCount} positive keywords detected`);
      }

      if (negativeCount > 0) {
        const penalty = Math.min(0.3, negativeCount * 0.1);
        score -= penalty;
        indicators.push(`${negativeCount} negative keywords detected`);
      }

      if (neutralCount > 0 && positiveCount === 0 && negativeCount === 0) {
        indicators.push(`${neutralCount} neutral keywords detected`);
      }
    }

    // Factor 3: Call duration (engaged carrier = more positive)
    if (input.call_duration) {
      if (input.call_duration > 120) {
        // Long call (2+ minutes) = engaged carrier
        score += 0.1;
        indicators.push('Long call duration (engaged carrier)');
      } else if (input.call_duration < 30) {
        // Very short call = likely negative
        score -= 0.1;
        indicators.push('Short call duration (disengaged)');
      }
    }

    // Clamp score to 0-1 range
    score = Math.max(0, Math.min(1, score));

    // Determine sentiment category
    let sentiment: Sentiment;
    if (score >= 0.6) {
      sentiment = 'POSITIVE';
    } else if (score >= 0.4) {
      sentiment = 'NEUTRAL';
    } else {
      sentiment = 'NEGATIVE';
    }

    console.log(`   Result: ${sentiment} (score: ${score.toFixed(2)})`);
    console.log(`   Indicators: ${indicators.join(', ')}`);

    return {
      sentiment,
      sentiment_score: Math.round(score * 100) / 100, // Round to 2 decimals
      indicators,
    };
  }

  /**
   * Get sentiment statistics
   */
  getSentimentStats() {
    return {
      sentiments: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
      scoreRanges: {
        POSITIVE: '0.6 - 1.0',
        NEUTRAL: '0.4 - 0.59',
        NEGATIVE: '0.0 - 0.39',
      },
      factors: [
        'Call outcome (booked/declined)',
        'Transcript keyword analysis',
        'Call duration (engagement)',
      ],
    };
  }
}

export const sentimentService = new SentimentService();
