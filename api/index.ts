/**
 * Vercel Serverless Function Entry Point
 * 
 * This file wraps the CACI Express backend as a Vercel serverless function.
 * Vercel routes all /api/* requests here via vercel.json rewrites.
 */
import app from '../server/src/app';

export default app;
