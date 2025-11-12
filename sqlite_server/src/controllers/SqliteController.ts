import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import  Database  from 'better-sqlite3';
import { BaseController } from './BaseController';
import { QueryRequest, UploadResponse, DatabaseTable } from '../types/sqlite';
import { convertCsvToSqlite, getDatabasePath, databaseExists } from '../utils/fileUtils';

export class SqliteController extends BaseController {
  /**
   * Upload SQLite or CSV file
   */
  uploadFile = this.asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return this.error(res, 'No file uploaded', 400);
    }

    try {
      const fileUuid = uuidv4();
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let newFilePath: string;

      if (fileExtension === '.sqlite') {
        newFilePath = getDatabasePath(fileUuid);
        fs.renameSync(req.file.path, newFilePath);
      } else if (fileExtension === '.csv') {
        const csvFilePath = req.file.path;
        newFilePath = getDatabasePath(fileUuid);
        
        try {
          await convertCsvToSqlite(csvFilePath, newFilePath);
          fs.unlinkSync(csvFilePath); // Delete the original CSV file
        } catch (error) {
          return this.error(res, 'Error converting CSV to SQLite', 500);
        }
      } else {
        return this.error(res, 'Invalid file type. Only .sqlite and .csv files are allowed.', 400);
      }

      const response: UploadResponse = { uuid: fileUuid };
      return res.json(response);
      
    } catch (error) {
      console.error('File upload error:', error);
      return this.error(res, 'Internal server error', 500);
    }
  });

  /**
   * Execute SQL query on uploaded database
   */
  executeQuery = this.asyncHandler(async (req: Request, res: Response) => {
    const { uuid, query }: QueryRequest = req.body;

    if (!uuid || !query) {
      return this.error(res, 'Missing uuid or query', 400);
    }

    if (!databaseExists(uuid)) {
      return this.error(res, 'Database not found', 404);
    }

    try {
      const dbPath = getDatabasePath(uuid);
      const db = new Database(dbPath, { readonly: true });
      
      const stmt = db.prepare(query);
      const rows = stmt.all() as any[];
      const results = rows.map((row: any) => Object.values(row));
      
      db.close();

      // Return results in the requested format
      return res.json({ results });
      
    } catch (error: any) {
      console.error('Query execution error:', error);
      return this.error(res, error.message || 'Query execution failed', 400);
    }
  });

  /**
   * Get database schema
   */
  getSchema = this.asyncHandler(async (req: Request, res: Response) => {
    const { uuid } = req.params;

    if (!uuid) {
      return this.error(res, 'Missing uuid', 400);
    }

    if (!databaseExists(uuid)) {
      return this.error(res, 'Database not found', 404);
    }

    try {
      const dbPath = getDatabasePath(uuid);
      const db = new Database(dbPath, { readonly: true });
      
      const tables: DatabaseTable[] = db
        .prepare("SELECT name, sql FROM sqlite_master WHERE type='table';")
        .all() as DatabaseTable[];

      const schema: string[] = [];

      for (const { name: tableName, sql: createStatement } of tables) {
        schema.push(`Table: ${tableName}`);
        schema.push(`CREATE statement: ${createStatement}\n`);

        try {
          const rows = db.prepare(`SELECT * FROM '${tableName}' LIMIT 3;`).all() as any[];
          if (rows.length > 0) {
            schema.push('Example rows:');
            rows.forEach((row: any) => schema.push(JSON.stringify(row)));
          }
        } catch (err) {
          console.error(`Error fetching rows for table ${tableName}:`, err);
        }
        
        schema.push(''); // Add blank line between tables
      }

      db.close();

      // Return schema in the requested format
      return res.json({ schema: schema.join('\n') });
      
    } catch (error: any) {
      console.error('Schema retrieval error:', error);
      return this.error(res, error.message || 'Schema retrieval failed', 500);
    }
  });
}