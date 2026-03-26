import outputs from "@/amplify_outputs.json";

function getGraphQlApiId() {
  const customApiId = (
    outputs as typeof outputs & {
      custom?: {
        dataApiId?: string;
      };
    }
  ).custom?.dataApiId;
  if (customApiId?.trim()) {
    return customApiId.trim();
  }

  const data = outputs.data;
  if (!data?.url) {
    throw new Error("Amplify Data URL is missing.");
  }

  const match = data.url.match(/^https:\/\/([^.]+)\./);
  if (!match?.[1]) {
    throw new Error("Amplify Data API ID could not be derived.");
  }

  console.warn(
    "[amplify-table-names] Falling back to deriving API id from data.url. " +
      "Set custom.dataApiId in amplify outputs to avoid endpoint/API id mismatches.",
  );
  return match[1];
}

export function getAmplifyModelTableName(modelName: string) {
  return `${modelName}-${getGraphQlApiId()}-NONE`;
}

export function getAmplifyDataRegion() {
  const region = outputs.data?.aws_region;
  if (!region) {
    throw new Error("Amplify Data region is missing.");
  }

  return region;
}
