// Logging utility function
export const logMessage = async (logFile, message) => {
    const logPath = path.join(path.dirname(logFile), logFile);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
  
    try {
      await fs.appendFile(logPath, logEntry);
    } catch (error) {
      console.error(`Failed to write to log file ${logFile}: ${error.message}`);
    }
  };