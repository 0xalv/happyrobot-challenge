import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface FMCSACarrier {
  mcNumber: string;
  legalName: string;
  dbaName?: string;
  status: string;
  isActive: boolean;
  physicalAddress?: string;
  phoneNumber?: string;
}

export class FMCSAService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.FMCSA_API_KEY || '';
    this.baseUrl = 'https://mobile.fmcsa.dot.gov/qc/services/carriers';
    console.log(`🔑 FMCSA API Key loaded: ${this.apiKey ? 'YES (' + this.apiKey.substring(0, 10) + '...)' : 'NO - MISSING!'}`);
  }

  async verifyCarrier(mcNumber: string): Promise<FMCSACarrier | null> {
    try {
      console.log(`🔍 Verifying MC number: ${mcNumber}`);

      // Call FMCSA API using docket-number endpoint
      const url = `${this.baseUrl}/docket-number/${mcNumber}?webKey=${this.apiKey}`;
      console.log(`📡 Calling FMCSA API: ${url.substring(0, url.length - 20)}...`); // Hide API key in logs

      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      console.log(`📦 Response status: ${response.status}`);
      console.log(`📦 Response data keys:`, Object.keys(response.data || {}));
      console.log(`📦 Content type:`, typeof response.data?.content, Array.isArray(response.data?.content) ? `(array, length: ${response.data.content.length})` : '');
      if (Array.isArray(response.data?.content) && response.data.content.length > 0) {
        console.log(`📦 Content[0] keys:`, Object.keys(response.data.content[0]));
        console.log(`📦 Has carrier:`, !!response.data.content[0]?.carrier);
      }

      // Parse carrier data - FMCSA API can return different formats
      let carrierData = null;

      // Option 1: content is an array with carrier inside (most common)
      if (Array.isArray(response.data?.content) && response.data.content[0]?.carrier) {
        carrierData = response.data.content[0].carrier;
      }
      // Option 2: carrier directly in content
      else if (response.data?.content?.carrier) {
        carrierData = response.data.content.carrier;
      }
      // Option 3: array of carriers
      else if (response.data?.content?.carriers && response.data.content.carriers.length > 0) {
        carrierData = response.data.content.carriers[0];
      }
      // Option 4: searchResults
      else if (response.data?.content?.searchResults && response.data.content.searchResults.length > 0) {
        carrierData = response.data.content.searchResults[0].carrier;
      }

      if (!carrierData) {
        console.log(`❌ Carrier not found: MC ${mcNumber}`);
        return null;
      }

      // Check eligibility based on FMCSA criteria
      const isAuthorized = carrierData.allowedToOperate === 'Y';
      const isInService = !carrierData.outOfServiceDate;
      const isActive = isAuthorized && isInService;

      const result: FMCSACarrier = {
        mcNumber: mcNumber,
        legalName: carrierData.legalName || 'Unknown',
        dbaName: carrierData.dbaName || undefined,
        status: carrierData.carrierOperation?.carrierOperationCode || carrierData.statusCode || 'UNKNOWN',
        isActive: isActive,
        physicalAddress: carrierData.phyStreet
          ? `${carrierData.phyStreet}, ${carrierData.phyCity || ''}, ${carrierData.phyState || ''} ${carrierData.phyZipcode || ''}`.trim()
          : undefined,
        phoneNumber: carrierData.telephone || undefined,
      };

      console.log(`✅ Carrier verified: ${result.legalName} (${result.isActive ? 'Eligible' : 'Not Eligible'})`);
      if (!isAuthorized) console.log(`   ⚠️ Not authorized to operate`);
      if (!isInService) console.log(`   ⚠️ Out of service since ${carrierData.outOfServiceDate}`);

      return result;
    } catch (error) {
      console.error(`🚨 Exception caught:`, error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.log(`❌ Carrier not found: MC ${mcNumber}`);
          return null;
        }
        if (error.response?.status === 403) {
          console.error(`❌ FMCSA API access forbidden (403) - Check VPN connection`);
          return null;
        }
        console.error(`❌ FMCSA API error (${error.response?.status}):`, error.message);
      } else {
        console.error(`❌ Error verifying carrier:`, error);
      }
      return null;
    }
  }
}

export const fmcsaService = new FMCSAService();
