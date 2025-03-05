import type { NextApiRequest, NextApiResponse } from 'next';

interface Event {
  type: string;
  phase: string;
  value: number;
  severity: string;
  description?: string;
}

interface EventsResponse {
  events: Event[];
  counters: Record<string, number>;
  total: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://oriontecno.com/api/events');
    if (!response.ok) {
      throw new Error(`Events API responded with status: ${response.status}`);
    }

    const data: EventsResponse = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 