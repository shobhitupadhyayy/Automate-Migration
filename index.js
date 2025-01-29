import readline from "readline";
import chalk from "chalk"; // Importing chalk for coloring
import {
  extractAutomationProjects,
  extractProjectRules,
} from "./libs/extractSourceAutomation.js";
import { createProject } from "./libs/createProject.js";
import { importRules } from "./libs/importAutomation.js";
import path from "path";
import fs from "fs";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(chalk.green(query), resolve));

// Format to create project name
const formatProjectName = (fileName) => {
  return fileName
    .replace("rules-", "")
    .replace(/_/g, " ")
    .replace(".json", "")
    .trim();
};

// Function to create a fresh extraction folder with current date and time
const createFreshExtractionFolder = () => {
  const now = new Date();
  const currentDateTime = now.toString().split(" GMT")[0];
  const extractionFolder = path.join(
    process.cwd(),
    `Migration Data - ${currentDateTime}`
  );

  if (!fs.existsSync(extractionFolder)) {
    fs.mkdirSync(extractionFolder, { recursive: true });
    console.log(`Folder '${extractionFolder}' created.`);
  }

  return extractionFolder;
};

const main = async () => {
  console.log("Welcome to the Automation Migration Tool!");

  // Step 2: Export Section
  const sourceAuthToken = await askQuestion("Enter Source Auth Token: ");
  const sourceOrgId = await askQuestion("Enter Source Organization ID: ");

  // Step 1: Create a fresh extraction folder
  const extractionFolder = createFreshExtractionFolder();
  const exportFolder = path.join(extractionFolder, "Export");

  if (!fs.existsSync(exportFolder)) {
    fs.mkdirSync(exportFolder);
    console.log(`Folder '${exportFolder}' created.`);
  }

  console.log("\nExtracting projects...");
  const projects = await extractAutomationProjects(
    sourceAuthToken,
    sourceOrgId,
    exportFolder
  );

  if (projects.length > 0) {
    console.log(`Extracted ${projects.length} projects.`);

    for (const project of projects) {
      console.log(`\nExtracting rules for Project: ${project.title}`);
      await extractProjectRules(
        sourceAuthToken,
        sourceOrgId,
        project,
        exportFolder
      );
    }
  } else {
    console.log("No projects found or extraction failed.");
    rl.close();
    return;
  }

  // Step 3: Import Section
  const destinationAuthToken = await askQuestion(
    "\nEnter Destination Auth Token: "
  );
  const destinationOrgId = await askQuestion(
    "Enter Destination Organization ID: "
  );

  console.log("\nCreating projects and importing rules...");
  const exportedFiles = fs.readdirSync(exportFolder);

  for (const fileName of exportedFiles) {
    if (fileName.startsWith("rules-") && fileName.endsWith(".json")) {
      const projectName = formatProjectName(fileName);
      console.log(`\nCreating Project: ${projectName}`);
      const newProjectId = await createProject(
        destinationAuthToken,
        destinationOrgId,
        projectName
      );

      if (newProjectId) {
        console.log(`Created Project: ${projectName}`);
        const filePath = path.join(exportFolder, fileName);
        console.log(`Importing rules from file path: ${filePath}`);
        await importRules(
          destinationAuthToken,
          destinationOrgId,
          newProjectId,
          filePath
        );
      } else {
        console.log(`Failed to create project: ${projectName}`);
      }
    }
  }

  console.log("\nMigration complete!");
  rl.close();
};

main();
