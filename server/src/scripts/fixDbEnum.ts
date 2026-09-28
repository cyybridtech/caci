import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connectionUrl = process.env.DATABASE_URL;
  if (!connectionUrl) {
    console.error('No DATABASE_URL found');
    process.exit(1);
  }

  console.log('Connecting to TiDB directly via mysql2 with SSL...');
  const connection = await mysql.createConnection({
    uri: connectionUrl,
    ssl: {
      rejectUnauthorized: true,
    },
  });

  try {
    console.log('1. Altering churchGroup column to VARCHAR(50)...');
    await connection.query('ALTER TABLE `members` MODIFY COLUMN `churchGroup` VARCHAR(50) NOT NULL DEFAULT "JOY"');
    console.log('2. Updating existing member groups (GROUP_1 -> JOY, GROUP_2 -> FAITH)...');
    await connection.query('UPDATE `members` SET `churchGroup` = "JOY" WHERE `churchGroup` = "GROUP_1" OR `churchGroup` IS NULL');
    await connection.query('UPDATE `members` SET `churchGroup` = "FAITH" WHERE `churchGroup` = "GROUP_2"');
    console.log('Successfully updated existing member rows!');
  } catch (err: any) {
    console.error('Error during raw MySQL migration:', err.message);
  } finally {
    await connection.end();
  }
}

run();
