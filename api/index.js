// Consolidated API router to handle multiple endpoints
import { Pool } from 'pg';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = req.url || '';
  const { query } = req;

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // System stats endpoint
    if (url.includes('/system-stats')) {
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

    // Festivals endpoints
    if (url.includes('/festivals')) {
      const { id } = query;

      if (req.method === 'GET') {
        if (id) {
          // Single festival
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
          
          const festival = result.rows[0];
          const transformedFestival = {
            ...festival,
            year: festival.start_date ? new Date(festival.start_date).getFullYear() : new Date().getFullYear(),
            budget_total: festival.budget || 0,
            budget_allocated: 0
          };
          
          return res.status(200).json(transformedFestival);
        }

        // All festivals
        const result = await pool.query(`
          SELECT id, name, description, start_date, end_date, location, 
                 website, contact_email, contact_phone, budget, status,
                 created_at, updated_at
          FROM festivals 
          ORDER BY start_date DESC
        `);

        await pool.end();
        
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
        
        const festival = result.rows[0];
        const transformedFestival = {
          ...festival,
          year: festival.start_date ? new Date(festival.start_date).getFullYear() : new Date().getFullYear(),
          budget_total: festival.budget || 0,
          budget_allocated: 0
        };
        
        return res.status(201).json(transformedFestival);
      }
    }

    // Stages endpoints
    if (url.includes('/stages-areas')) {
      const { id } = query;

      if (req.method === 'GET') {
        const { event_id } = query;
        
        let stagesQuery = 'SELECT * FROM stages_areas';
        const params = [];
        
        if (event_id) {
          stagesQuery += ' WHERE event_id = $1';
          params.push(event_id);
        }
        
        stagesQuery += ' ORDER BY sort_order ASC, id ASC';
        
        const result = await pool.query(stagesQuery, params);
        await pool.end();
        
        return res.status(200).json(result.rows);
      }

      if (req.method === 'PUT') {
        // Check if this is a reorder request (batch update)
        if (req.body.stages && Array.isArray(req.body.stages)) {
          try {
            for (const stage of req.body.stages) {
              await pool.query(`
                UPDATE stages_areas SET sort_order = $1 WHERE id = $2
              `, [stage.sort_order, stage.id]);
            }
            
            const result = await pool.query(`
              SELECT * FROM stages_areas WHERE event_id = $1 ORDER BY sort_order ASC, id ASC
            `, [req.body.stages[0].event_id || 1]);
            
            await pool.end();
            return res.status(200).json(result.rows);
          } catch (error) {
            await pool.end();
            throw error;
          }
        }
      }
    }

    // Artists endpoints
    if (url.includes('/artists')) {
      const { id, festival_id } = query;

      if (req.method === 'GET') {
        if (id) {
          // Single artist
          const result = await pool.query(`
            SELECT * FROM artists WHERE id = $1
          `, [id]);
          
          await pool.end();
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Artist not found' });
          }
          
          return res.status(200).json(result.rows[0]);
        }

        // All artists (optionally filtered by festival)
        let query = 'SELECT * FROM artists';
        const params = [];
        
        if (festival_id) {
          query += ' WHERE festival_id = $1';
          params.push(festival_id);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await pool.query(query, params);
        await pool.end();
        
        return res.status(200).json(result.rows);
      }

      if (req.method === 'POST') {
        const {
          festival_id, name, genre, contact_name, contact_email, contact_phone,
          rider_requirements, technical_requirements, fee, fee_status,
          travel_requirements, accommodation_requirements, status
        } = req.body;

        const result = await pool.query(`
          INSERT INTO artists (
            festival_id, name, genre, contact_name, contact_email, contact_phone,
            rider_requirements, technical_requirements, fee, fee_status,
            travel_requirements, accommodation_requirements, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `, [
          festival_id || 1, name, genre, contact_name, contact_email, contact_phone,
          rider_requirements, technical_requirements, fee, fee_status || 'quoted',
          travel_requirements, accommodation_requirements, status || 'inquired'
        ]);

        await pool.end();
        return res.status(201).json(result.rows[0]);
      }
    }

    await pool.end();
    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('Consolidated API error:', error);
    
    // Ensure database connection is closed
    try {
      await pool.end();
    } catch (poolError) {
      console.error('Pool cleanup error:', poolError);
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'API request failed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}