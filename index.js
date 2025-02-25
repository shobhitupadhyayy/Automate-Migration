import readline from "readline";
import chalk from "chalk";
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
  const sourceAuthToken = await askQuestion("Enter Source Org User Auth Token: ");
  const sourceOrgId = await askQuestion("Enter Source Organization ID: ");
  
  // New Step: Ask for the region
  const region = await askQuestion("Enter the source region (aws-na, gcp-na, azure-eu): ");
  
  // Set the URI based on the region
  let uri;
  switch (region.toLowerCase()) {
    case 'aws-na':
      uri = 'https://app.contentstack.com/automations-api/projects/';
      break;
    case 'gcp-na':
      uri = 'https://gcp-na-app.contentstack.com/automations-api/projects/';
      break;
    case 'azure-eu':
      uri = 'https://azure-eu-app.contentstack.com/automations-api/projects/';
      break;
    default:
      console.log("Invalid region entered. Exiting...");
      process.exit(1);
  }

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
    exportFolder,
    uri
  );

  if (projects.length > 0) {

    for (const project of projects) {
      console.log(`\nExtracting rules for Project: ${project.title}`);
      await extractProjectRules(
        sourceAuthToken,
        sourceOrgId,
        project,
        exportFolder,
        uri
      );
    }
    console.log(chalk.green(`\nExtracted ${projects.length} projects.`));
  } else {
    console.log("No projects found or extraction failed.");
    rl.close();
    return;
  }

  // Step 3: Import Section
  const destinationAuthToken = await askQuestion(
    "\nEnter Destination Org User Auth Token: "
  );
  const destinationOrgId = await askQuestion(
    "Enter Destination Organization ID: "
  );
  let destinationUri = await askQuestion(
    "Enter the Destination Region (aws-na, gcp-na, azure-eu): "
  );

  switch (destinationUri.toLowerCase()) {
    case 'aws-na':
      destinationUri = 'https://app.contentstack.com/automations-api/';
      break;
    case 'gcp-na':
      destinationUri = 'https://gcp-na-app.contentstack.com/automations-api/';
      break;
    case 'azure-eu':
      destinationUri = 'https://azure-eu-app.contentstack.com/automations-api/';
      break;
    default:
      console.log("Invalid region entered. Exiting...");
      process.exit(1);
  }

  console.log("\nCreating projects and importing rules...");
  const exportedFiles = fs.readdirSync(exportFolder);

  for (const fileName of exportedFiles) {
    if (fileName.startsWith("rules-") && fileName.endsWith(".json")) {
      const projectName = formatProjectName(fileName);
      console.log(`\nCreating Project: ${projectName}`);
      const newProjectId = await createProject(
        destinationAuthToken,
        destinationOrgId,
        projectName,
        destinationUri
      );

      if (newProjectId) {
        console.log(chalk.green(`Created Project: ${projectName}`));
        const filePath = path.join(exportFolder, fileName);
        console.log(`Importing rules from file path: ${filePath}`);
        await importRules(
          destinationAuthToken,
          destinationOrgId,
          newProjectId,
          filePath, 
          destinationUri
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
