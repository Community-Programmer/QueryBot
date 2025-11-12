import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3');

/**
 * Delete files older than specified age
 */
export const deleteOldFiles = (): void => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const currentTime = Date.now();
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    return;
  }

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return;
    }

    files.forEach((file) => {
      // Skip deleting the example file
      if (file.includes('921c838c-541d-4361-8c96-70cb23abd9f5.sqlite')) {
        return;
      }

      const filePath = path.join(uploadsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting file stats for ${file}:`, err);
          return;
        }

        const fileAge = currentTime - stats.mtime.getTime();
        // Delete files older than 4 hours (14400000 milliseconds)
        if (fileAge > 14400000) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${file}:`, err);
            } else {
              console.log(`Deleted old file: ${file}`);
            }
          });
        }
      });
    });
  });
};

/**
 * Convert CSV file to SQLite database
 */
export const convertCsvToSqlite = (csvFilePath: string, sqliteFilePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        if (results.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        try {
          const db = new Database(sqliteFilePath);
          const columns = Object.keys(results[0]);
          const tableName = 'csv_data';
          
          // Create table with quoted column names to handle special characters
          const createTableQuery = `CREATE TABLE ${tableName} (${columns
            .map((col) => `"${col}" TEXT`)
            .join(', ')})`;

          db.exec(createTableQuery);

          // Prepare insert statement
          const insertStmt = db.prepare(
            `INSERT INTO ${tableName} VALUES (${columns
              .map(() => '?')
              .join(', ')})`
          );

          // Use transaction for better performance
          const insertMany = db.transaction((rows: any[]) => {
            for (const row of rows) {
              insertStmt.run(Object.values(row));
            }
          });

          insertMany(results);
          db.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
};

/**
 * Ensure uploads directory exists
 */
export const ensureUploadsDir = (): void => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
};

/**
 * Get file path for database UUID
 */
export const getDatabasePath = (uuid: string): string => {
  return path.join(process.cwd(), 'uploads', `${uuid}.sqlite`);
};

/**
 * Check if database file exists
 */
export const databaseExists = (uuid: string): boolean => {
  return fs.existsSync(getDatabasePath(uuid));
};