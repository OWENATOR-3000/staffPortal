// lib/db.ts
import mysql from 'mysql2/promise';

// This is the standard "Singleton Pattern" for database connections in a Next.js
// development environment. It prevents multiple connection pools from being created
// every time the code is hot-reloaded.

// We first extend the NodeJS.Global interface to include our custom 'mysql' property.
// This tells TypeScript that we are intentionally adding a property to the global scope.
declare global {
  var mysql: mysql.Pool | undefined;
}

let pool: mysql.Pool;

// We check if the environment is production.
if (process.env.NODE_ENV === 'production') {
  // In a production environment, we always create a new, single connection pool.
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'staff_portal_db',
    waitForConnections: true,
    connectionLimit: 15, // A reasonable limit for a small production app
    queueLimit: 0,
  });
} else {
  // In a development environment, we check if a connection pool already exists
  // on the global object.
  if (!global.mysql) {
    // If it doesn't exist, we create it and attach it to the global object.
    console.log("Creating a new database connection pool for development...");
    global.mysql = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'staff_portal_db',
      waitForConnections: true,
      connectionLimit: 10, // A smaller limit for dev is fine
      queueLimit: 0,
    });
  }
  // We then reuse the existing pool from the global object on subsequent hot-reloads.
  pool = global.mysql;
}

export default pool;