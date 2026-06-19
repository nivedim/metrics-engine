import fs from 'fs';
import path from 'path';

// Helper function to recursively find all TypeScript files in the project
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules and test directories
      if (!file.includes('node_modules') && !file.includes('__tests__')) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts')) {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

describe('Architecture Guard: Revenue Calculation Integrity', () => {
  it('should enforce that only metrics.ts can query the transactions table directly', () => {
    const srcDirectory = path.join(__dirname, '../');
    const allFiles = getAllFiles(srcDirectory);

    // Rogue patterns we want to block (e.g., bypassing our service layer)
    const illegalPatterns = [
      /\.from\(['"]transactions['"]\)/i, // Catches: supabase.from('transactions')
    ];

    allFiles.forEach((filePath) => {
      // Exclude our authorized files (The Metrics Service & Ingestion Service)
      if (filePath.endsWith('metrics.ts') || filePath.endsWith('ingestion.ts')) {
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');

      illegalPatterns.forEach((pattern) => {
        const containsIllegalQuery = pattern.test(fileContent);
        
        // If a rogue query pattern is found, fail the test explicitly
        expect(containsIllegalQuery).toBe(false);
      });
    });
  });
});