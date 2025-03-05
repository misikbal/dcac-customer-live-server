import type { NextApiRequest, NextApiResponse } from 'next';

interface PowerQualityData {
  timestamp: number;
  volt: number[];
  current: number[];
  power: [number[], number[], number[], number[], number[]];
  events?: Array<{
    type: string;
    phase: string;
    value: number;
    severity: string;
    description?: string;
  }>;
}

// Cache-Control header'ını devre dışı bırak
export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS header'larını ekle
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const backendUrl = process.env.BACKEND_URL || 'https://oriontecno.com';
    
    // Power quality verilerini al
    const powerResponse = await fetch(`${backendUrl}/api/power-quality`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!powerResponse.ok) {
      throw new Error(`Power quality API responded with ${powerResponse.status}`);
    }
    const powerData = await powerResponse.json();

    // Events verilerini al
    const eventsResponse = await fetch(`${backendUrl}/api/events`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!eventsResponse.ok) {
      throw new Error(`Events API responded with ${eventsResponse.status}`);
    }
    const eventsData = await eventsResponse.json();

    // Verileri birleştir
    const combinedData = Array.isArray(powerData) ? powerData : [powerData];
    const responseData = combinedData.map(item => ({
      ...item,
      events: eventsData.events || []
    }));

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}