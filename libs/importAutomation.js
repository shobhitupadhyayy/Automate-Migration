import fs from "fs";
import fetch from "node-fetch";
import path from "path";

// Constants
const baseUrl = "https://gcp-na-app.contentstack.com/automations-api";
let connectors = {};

// Utility functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// IST format time
const getISTTime = () => {
  const now = new Date();
  const options = { timeZone: "Asia/Kolkata", hour12: false };
  return now.toLocaleString("en-IN", options).replace(",", "");
};

const logToFile = (exportFolder, message) => {
  const successLogFilePath = path.join(exportFolder, "success.log");
  const logMessage = `[${getISTTime()}] ${message}\n`;
  fs.appendFileSync(successLogFilePath, logMessage, "utf8");
};

const readFile = async (filePath) => {
  try {
    return await fs.promises.readFile(filePath, { encoding: "utf8" });
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}. Error: ${error.message}`);
  }
};

const writeFile = async (filePath, data) =>
  fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));

const fetchJSON = async (url, options = {}) => {
  await delay(2000);
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const getConnectors = async (stepGroups, headers) => {
  const response = await fetchJSON(`${baseUrl}/connectors`, { headers });
  const map = {};

  response?.forEach((connector) => {
    if (stepGroups.includes(connector.group_name)) {
      map[connector.group_name] = connector;
    }
  });

  return map;
};

const getActions = async (groupName, headers) => {
  if (["ifelse", "loop", "repeat"].includes(groupName)) return;

  if (!connectors[groupName]) {
    connectors[groupName] = (await getConnectors([groupName], headers))[groupName];
  }

  const url = `${baseUrl}/connectors/${connectors[groupName].id}/actions`;
  connectors[groupName].actions = (await fetchJSON(url, { headers })).reduce((acc, action) => {
    acc[action.title] = action;
    return acc;
  }, {});
};

export const importRules = async (authToken, organization_uid, projectId, filePath) => {
  const headers = {
    "Content-Type": "application/json",
    authtoken: authToken,
    organization_uid,
  };

  const importFolder = path.join(path.dirname(filePath), "../Import");
  await fs.promises.mkdir(importFolder, { recursive: true }); // Fixed mkdir issue

  try {
    const rules = JSON.parse(await readFile(filePath));
    console.log("Exported Rules: ", JSON.stringify(rules, null, 2));

    const importFilePath = path.join(importFolder, path.basename(filePath));
    let existingRules = { rules: [] };

    try {
      await fs.promises.access(importFilePath);
      existingRules = JSON.parse(await readFile(importFilePath));
    } catch (err) {
      if (err.code !== "ENOENT") throw new Error(`Error checking Import file: ${err.message}`);
    }

    for (const rule of rules.rules) {
      console.log(`Processing rule: ${rule.title}`);
      logToFile(importFolder, `Processing rule: ${rule.title}`);

      rule.step_groups = rule.step_groups.filter(Boolean);
      connectors = await getConnectors(rule.step_groups, headers);

      for (const groupName of rule.step_groups) {
        await getActions(groupName, headers);
      }

      const newRule = {
        ...rule,
        _id: undefined,
        id: undefined,
        active: false,
        published: false,
        user_id: rule.user_id,
        org_id: headers.organization_uid,
        project_id: projectId,
        share_id: null,
        trigger: { id: rule.trigger.id, next: [rule?.steps?.[0]?.name] },
        created_at: new Date(),
        updated_at: new Date(),
        isDraftRule: true,
      };

      existingRules.rules.push(newRule);
      const res = await fetch(`${baseUrl}/projects/${projectId}/rules`, {
        method: "POST",
        headers,
        body: JSON.stringify(newRule),
      });

      if (res.ok) {
        console.log(`Rule imported successfully: ${rule.title}`);
        logToFile(importFolder, `Rule imported successfully: ${rule.title}`);
      } else {
        const errorDetails = await res.json();
        logToFile(importFolder, `Failed to import rule: ${rule.title} - ${JSON.stringify(errorDetails)}`);
      }
    }

    await writeFile(importFilePath, existingRules);
    console.log(`Processed rules saved successfully to: ${importFilePath}`);
    logToFile(importFolder, `Processed rules saved successfully to: ${importFilePath}`);
  } catch (error) {
    console.error(`Error importing rules: ${error.message}`);
    logToFile(importFolder, `Error importing rules: ${error.message}`);
  }
};
