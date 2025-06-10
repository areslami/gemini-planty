const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3000; // This is the port your API will run on. You can change it if it conflicts.

// --- PostgreSQL connection pool configuration ---
// IMPORTANT: Replace 'YOUR_POSTGRES_PASSWORD' with the actual password you set for your PostgreSQL 'postgres' user.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/plant_tracker_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // Render's PostgreSQL requires SSL
});

// --- Middleware Setup ---
app.use(cors()); // Enables Cross-Origin Resource Sharing for all routes
app.use(express.json()); // Allows the API to understand JSON data sent from the frontend

// --- Test Database Connection ---
// This runs once when the server starts to confirm it can connect to the database.
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client from pool', err.stack);
    }
    console.log('Successfully connected to PostgreSQL database!');
    client.release(); // Releases the client back to the pool
});

// ------------------- API Endpoints (The "rules" for your app's data) -------------------

// 1. Get all plants for the dropdown list on the Tracker page
app.get('/api/plants', async (req, res) => {
    try {
        const result = await pool.query('SELECT plant_name, minimum_moisture_level FROM Plants ORDER BY plant_name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching plants:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. Get all supplements for the multiple-choice list on the Tracker page
app.get('/api/supplements', async (req, res) => {
    try {
        const result = await pool.query('SELECT supplement_name FROM Supplements ORDER BY supplement_name');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching supplements:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. Get the "Relative Moisture Level" for a selected plant (currently using min_moisture_level as an example)
app.get('/api/plants/:plantName/relative-moisture', async (req, res) => {
    const { plantName } = req.params; // Get the plant name from the URL
    try {
        const result = await pool.query('SELECT minimum_moisture_level FROM Plants WHERE plant_name = $1', [plantName]);
        if (result.rows.length > 0) {
            res.json({ relative_moisture_level: result.rows[0].minimum_moisture_level });
        } else {
            res.status(404).json({ message: 'Plant not found' });
        }
    } catch (err) {
        console.error('Error fetching relative moisture level:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. Record new plant data (triggered by "Water and Save" or "Save" buttons)
app.post('/api/records', async (req, res) => {
    // Extract data sent from the frontend
    const { plantName, supplements, recordDate, moistureLevel, watered } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Records (plant_name, supplements, record_date, moisture_level, watered) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [plantName, supplements, recordDate, moistureLevel, watered]
        );
        res.status(201).json(result.rows[0]); // Send back the newly created record with a success status
    } catch (err) {
        console.error('Error saving record:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// 5. Get the last 10 records for a specific plant (for the "Last 10 Records" box on Tracker page)
app.get('/api/records/:plantName/latest', async (req, res) => {
    const { plantName } = req.params;
    try {
        const result = await pool.query(
            'SELECT record_date, moisture_level, supplements, watered FROM Records WHERE plant_name = $1 ORDER BY record_date DESC, record_id DESC LIMIT 10',
            [plantName]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching latest records:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- Helper function for calculating Weighted Moving Average Watering Interval ---
// This function is used by the API endpoints below to calculate the WMA.
async function calculateMAMoistureInterval(plantName) {
    const query = `
        SELECT record_date, watered
        FROM Records
        WHERE plant_name = $1 AND watered = TRUE
        ORDER BY record_date ASC, record_id ASC;
    `;
    const result = await pool.query(query, [plantName]);
    const wateringDates = result.rows.map(row => new Date(row.record_date));

    if (wateringDates.length < 2) {
        return null; // Not enough watering data to calculate an interval
    }

    const intervals = [];
    for (let i = 1; i < wateringDates.length; i++) {
        const diffTime = Math.abs(wateringDates[i].getTime() - wateringDates[i - 1].getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to full days
        intervals.push(diffDays);
    }

    let weightedSum = 0;
    let totalWeight = 0;

    // Apply weights: 0.6 to latest 3, 0.3 to latter 3, 0.1 to the rest
    // Latest 3 intervals (0.6 weight)
    for (let i = Math.max(0, intervals.length - 3); i < intervals.length; i++) {
        weightedSum += intervals[i] * 0.6;
        totalWeight += 0.6;
    }

    // Latter 3 intervals (0.3 weight) - these are the 3 *before* the latest 3
    const startIndexForLatter3 = Math.max(0, intervals.length - 6);
    const endIndexForLatter3 = Math.max(0, intervals.length - 3);
    for (let i = startIndexForLatter3; i < endIndexForLatter3; i++) {
        weightedSum += intervals[i] * 0.3;
        totalWeight += 0.3;
    }

    // Rest of the intervals (0.1 weight)
    for (let i = 0; i < Math.max(0, intervals.length - 6); i++) {
        weightedSum += intervals[i] * 0.1;
        totalWeight += 0.1;
    }

    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : null; // Return with 2 decimal places
}

// 6. Get "Days since last watering" and "MA Watering Interval" for a specific plant (for Tracker page)
app.get('/api/plants/:plantName/watering-stats', async (req, res) => {
    const { plantName } = req.params;
    try {
        // Calculate Days since last watering
        const lastWateringResult = await pool.query(
            'SELECT record_date FROM Records WHERE plant_name = $1 AND watered = TRUE ORDER BY record_date DESC, record_id DESC LIMIT 1',
            [plantName]
        );

        let daysSinceLastWatering = null;
        if (lastWateringResult.rows.length > 0) {
            const lastWateredDate = new Date(lastWateringResult.rows[0].record_date);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate.getTime() - lastWateredDate.getTime());
            daysSinceLastWatering = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to whole days
        }

        // Calculate MA Watering Interval using the helper function
        const maWateringInterval = await calculateMAMoistureInterval(plantName);

        res.json({
            daysSinceLastWatering: daysSinceLastWatering,
            maWateringInterval: maWateringInterval
        });

    } catch (err) {
        console.error('Error fetching watering stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 7. Get all plants' overview data (for the Overview page)
app.get('/api/overview', async (req, res) => {
    try {
        // Get all plant names and their minimum moisture levels
        const plantsResult = await pool.query('SELECT plant_name, minimum_moisture_level FROM Plants ORDER BY plant_name');
        const overviewData = [];

        // Loop through each plant to gather all required data for the overview
        for (const plant of plantsResult.rows) {
            const plantName = plant.plant_name;
            const minimumMoistureLevel = plant.minimum_moisture_level;

            // Fetch the last watering date for the current plant
            const lastWateringInfo = await pool.query(
                `SELECT record_date FROM Records WHERE plant_name = $1 AND watered = TRUE ORDER BY record_date DESC, record_id DESC LIMIT 1`,
                [plantName]
            );

            let daysSinceLastWatering = null;
            if (lastWateringInfo.rows.length > 0) {
                const lastWateredDate = new Date(lastWateringInfo.rows[0].record_date);
                const currentDate = new Date();
                const diffTime = Math.abs(currentDate.getTime() - lastWateredDate.getTime());
                daysSinceLastWatering = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }

            // Calculate the MA Watering Interval for the current plant
            const maWateringInterval = await calculateMAMoistureInterval(plantName);
            const avgInterval = maWateringInterval !== null ? parseFloat(maWateringInterval) : null;

            // Determine the status color based on watering interval
            let statusColor = 'gray'; // Default color if no watering data or MA interval
            if (avgInterval !== null && daysSinceLastWatering !== null) {
                if (daysSinceLastWatering < avgInterval - 2) {
                    statusColor = 'green'; // Watered recently (less than 2 days before average)
                } else if (daysSinceLastWatering >= avgInterval - 2 && daysSinceLastWatering <= avgInterval + 1) {
                    statusColor = 'yellow'; // Water soon (within -2 days to +1 day of average)
                } else if (daysSinceLastWatering > avgInterval + 1) {
                    statusColor = 'red'; // Overdue for watering (more than 1 day past average)
                }
            }

            // Fetch the latest recorded entry for the current plant (not necessarily a watering event)
            const latestEntryResult = await pool.query(
                `SELECT record_date, moisture_level
                FROM Records
                WHERE plant_name = $1
                ORDER BY record_date DESC, record_id DESC LIMIT 1`,
                [plantName]
            );

            let latestRecordedDate = null;
            let latestRecordedMoisture = null;

            if (latestEntryResult.rows.length > 0) {
                const latestRecordDate = new Date(latestEntryResult.rows[0].record_date);
                const lastWateredDateCheck = lastWateringInfo.rows.length > 0 ? new Date(lastWateringInfo.rows[0].record_date) : null;

                // Condition: Show latest record if no watering has happened OR if the latest record is newer than the last watering date
                if (lastWateredDateCheck === null || latestRecordDate.getTime() > lastWateredDateCheck.getTime()) {
                    latestRecordedDate = latestEntryResult.rows[0].record_date;
                    latestRecordedMoisture = latestEntryResult.rows[0].moisture_level;
                }
            }

            // Add all collected data for the current plant to the overview list
            overviewData.push({
                plantName,
                minimumMoistureLevel,
                maWateringInterval: avgInterval,
                daysSinceLastWatering,
                statusColor,
                latestRecordedDate,
                latestRecordedMoisture
            });
        }
        res.json(overviewData); // Send the complete overview data back to the frontend
    } catch (err) {
        console.error('Error fetching overview data:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// --- Start the API Server ---
app.listen(port, () => {
    console.log(`Backend API for Gemini Planty listening at http://localhost:${port}`);
});

app.post('/api/plants', async (req, res) => {
    const { plantName, minimumMoistureLevel } = req.body;
    if (!plantName || minimumMoistureLevel === undefined) {
        return res.status(400).json({ error: 'Plant name and Minimum Moisture Level are required.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO Plants (plant_name, minimum_moisture_level) VALUES ($1, $2) RETURNING *',
            [plantName, minimumMoistureLevel]
        );
        res.status(201).json(result.rows[0]); // 201 Created
    } catch (err) {
        console.error('Error adding new plant:', err);
        // Check if error is due to duplicate primary key (plant_name already exists)
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ error: 'Plant name already exists.' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// Add a new supplement
app.post('/api/supplements', async (req, res) => {
    const { supplementName } = req.body;
    if (!supplementName) {
        return res.status(400).json({ error: 'Supplement name is required.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO Supplements (supplement_name) VALUES ($1) RETURNING *',
            [supplementName]
        );
        res.status(201).json(result.rows[0]); // 201 Created
    } catch (err) {
        console.error('Error adding new supplement:', err);
        // Check if error is due to duplicate primary key
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(409).json({ error: 'Supplement name already exists.' });
        }
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});
