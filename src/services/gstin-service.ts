
/**
 * @fileOverview A mock service to simulate fetching company details from a GSTIN.
 * In a real application, this would be replaced with a call to a live API.
 */

interface GstDetails {
    gstin: string;
    name: string;
    address: string;
}

// Mock database of GSTIN details
const mockGstDatabase: Record<string, GstDetails> = {
    "27AAFCT6913H1Z3": {
        gstin: "27AAFCT6913H1Z3",
        name: "Bayer Pharmaceuticals",
        address: "Bayer House, Hiranandani Estate, Thane West, Mumbai, Maharashtra 400607",
    },
    "27AABCP5871N1Z5": {
        gstin: "27AABCP5871N1Z5",
        name: "Pfizer India Ltd",
        address: "The Capital, 1802, 1901, Plot No. C-70, G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
    },
    "27AAACS1116L1ZG": {
        gstin: "27AAACS1116L1ZG",
        name: "Sun Pharmaceutical Industries",
        address: "Sun House, CTS No. 201 B/1, Western Express Highway, Goregaon (E), Mumbai 400063, Maharashtra",
    },
    "27AAACC2728D1Z2": {
        gstin: "27AAACC2728D1Z2",
        name: "Cipla Ltd",
        address: "Cipla House, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel, Mumbai 400013, Maharashtra",
    }
};

/**
 * Simulates an API call to fetch company details for a given GSTIN.
 * @param gstin The 15-digit GST Identification Number.
 * @returns A promise that resolves with the company details or null if not found.
 */
export async function fetchGstDetails(gstin: string): Promise<GstDetails | null> {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 750));

    if (mockGstDatabase[gstin]) {
        return mockGstDatabase[gstin];
    }
    
    return null;
}
