/**
 * tests/setup.js — Jest global setup
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

// Silence console.error/log during tests
global.console.error = jest.fn();
global.console.log   = jest.fn();
global.console.warn  = jest.fn();
