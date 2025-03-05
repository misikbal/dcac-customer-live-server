// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Burada mevcut Node.js backend'inizden veri çekme işlemi yapılacak
    const response = await fetch('https://oriontecno.com/api/power-quality');
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching power quality data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
