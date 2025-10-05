// Common types for the API

export interface LoadSearchCriteria {
  origin?: string;
  destination?: string;
  equipment_type?: string;
}

export interface NegotiationOffer {
  loadboardRate: number;
  carrierOffer: number;
  round: number;
}

export type NegotiationAction = 'accept' | 'counter' | 'reject' | 'transfer';

export type CallOutcome =
  | 'BOOKED'
  | 'NEGOTIATING'
  | 'TRANSFERRED'
  | 'REJECTED'
  | 'INVALID_MC'
  | 'NO_LOADS';

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
