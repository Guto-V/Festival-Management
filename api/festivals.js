// Festivals API endpoint
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Get ID from query parameter (rewritten by Vercel routes)
    const { id } = req.query;

    if (req.method === 'GET') {
      
      if (id) {
        // Check if requesting stats for this festival
        if (url.includes('/stats')) {
          // Get festival statistics
          const [
            artistsResult,
            performancesResult,
            venuesResult,
            volunteersResult
          ] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM artists WHERE festival_id = $1', [id]),
            pool.query('SELECT COUNT(*) as count FROM performances WHERE festival_id = $1', [id]),
            pool.query('SELECT COUNT(*) as count FROM stages_areas WHERE event_id = $1', [id]),
            pool.query('SELECT COUNT(*) as count FROM volunteer_applications WHERE festival_id = $1', [id])
          ]);

          await pool.end();

          const stats = {
            festival_id: parseInt(id),
            venues: parseInt(venuesResult.rows[0].count),
            performances: parseInt(performancesResult.rows[0].count),
            artists: parseInt(artistsResult.rows[0].count),
            volunteers: parseInt(volunteersResult.rows[0].count),
            vendors: 0, // TODO: Add vendors count when vendors table exists
            total_income: 0,
            total_expenses: 0,
            net_profit: 0
          };

          return res.status(200).json(stats);
        }

        // Get single festival by ID
        const result = await pool.query(`
          SELECT id, name, description, start_date, end_date, location, 
                 website, contact_email, contact_phone, budget, status,
                 created_at, updated_at
          FROM festivals 
          WHERE id = $1
        `, [id]);
        
        await pool.end();
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Festival not found' });
        }
        
        // Transform response to match frontend interface
        const festival = result.rows[0];
        const transformedFestival = {
          ...festival,
          year: festival.start_date ? new Date(festival.start_date).getFullYear() : new Date().getFullYear(),
          budget_total: festival.budget || 0,
          budget_allocated: 0
        };
        
        return res.status(200).json(transformedFestival);
      }
      
      // Check if requesting system stats
      if (url.includes('system-stats')) {
        const [
          festivalsResult,
          artistsResult,
          usersResult
        ] = await Promise.all([
          pool.query('SELECT COUNT(*) as count FROM festivals'),
          pool.query('SELECT COUNT(*) as count FROM artists'),
          pool.query('SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL')
        ]);

        await pool.end();

        const systemStats = {
          totalFestivals: parseInt(festivalsResult.rows[0].count),
          totalArtists: parseInt(artistsResult.rows[0].count),
          totalUsers: parseInt(usersResult.rows[0].count)
        };

        return res.status(200).json({
          success: true,
          stats: systemStats
        });
      }

      // Get all festivals
      const result = await pool.query(`
        SELECT id, name, description, start_date, end_date, location, 
               website, contact_email, contact_phone, budget, status,
               created_at, updated_at
        FROM festivals 
        ORDER BY start_date DESC
      `);

      await pool.end();
      
      // Transform all festivals to match frontend interface
      const transformedFestivals = result.rows.map(festival => ({
        ...festival,
        year: festival.start_date ? new Date(festival.start_date).getFullYear() : new Date().getFullYear(),
        budget_total: festival.budget || 0,
        budget_allocated: 0
      }));
      
      return res.status(200).json(transformedFestivals);
    }

    if (req.method === 'POST') {
      const { name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status } = req.body;

      const result = await pool.query(`
        INSERT INTO festivals (name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [name, description, start_date, end_date, location, website, contact_email, contact_phone, budget, status || 'planning']);

      await pool.end();
      
      // Transform response to match frontend interface
      const festival = result.rows[0];
      const transformedFestival = {
        ...festival,
        year: festival.start_date ? new Date(festival.start_date).getFullYear() : new Date().getFullYear(),
        budget_total: festival.budget || 0,
        budget_allocated: 0
      };
      
      return res.status(201).json(transformedFestival);
    }

    if (req.method === 'PUT') {
      // Extract only the fields that exist in our database schema
      const { 
        name, description, start_date, end_date, location, 
        website, contact_email, contact_phone, status,
        budget, budget_total // Accept both budget and budget_total
      } = req.body;
      
      console.log('PUT request body:', req.body);
      console.log('Festival ID:', id);

      // Handle null/undefined dates
      const startDate = start_date || null;
      const endDate = end_date || null;
      
      // Use budget_total if budget is not provided
      const budgetValue = budget !== undefined ? budget : budget_total;
      
      const result = await pool.query(`
        UPDATE festivals SET
          name = $1, description = $2, start_date = $3, end_date = $4,
          location = $5, website = $6, contact_email = $7, contact_phone = $8,
          budget = $9, status = $10, updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
      `, [name, description, startDate, endDate, location, website, contact_email, contact_phone, budgetValue, status, id]);

      await pool.end();
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Festival not found' });
      }
      
      // Transform response to match frontend interface
      const festival = result.rows[0];
      const transformedFestival = {
        ...festival,
        year: festival.start_date ? new Date(festival.start_date).getFullYear() : new Date().getFullYear(),
        budget_total: festival.budget || 0,
        budget_allocated: 0
      };
      
      return res.status(200).json(transformedFestival);
    }

    await pool.end();
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Festivals API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to load festivals',
      error: error.message 
    });
  }
}