const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

const db = require('../../db/db');
const AppError = require('../../utils/AppError');
const { loadFabricConfig } = require('../../config/fabric/fabricConfig');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeString(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  return value.trim();
}

function toLowerKey(value) {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
}

function uniquePush(map, organizationName, mspId) {
  const name = normalizeString(organizationName);
  if (!name) {
    return;
  }

  const key = toLowerKey(name);
  const existing = map.get(key);

  if (!existing) {
    map.set(key, {
      organization_name: name,
      msp_id: normalizeString(mspId),
    });
    return;
  }

  if (!existing.msp_id && isNonEmptyString(mspId)) {
    existing.msp_id = normalizeString(mspId);
  }
}

async function readYamlOrJsonFile(filePath) {
  if (!filePath) {
    return null;
  }

  const absolutePath = path.resolve(filePath);
  const exists = await fs.pathExists(absolutePath);
  if (!exists) {
    return null;
  }

  const raw = await fs.readFile(absolutePath, 'utf8');

  try {
    const parsed = yaml.load(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    throw new AppError(
      `Unable to parse Fabric metadata file ${absolutePath}: ${error.message}`,
      400,
      'FABRIC_METADATA_PARSE_FAILED',
      { filePath: absolutePath },
    );
  }
}

function collectOrganizationsFromConfigTx(configTx) {
  const organizations = new Map();
  const sections = [
    configTx?.Organizations,
    configTx?.Application?.Organizations,
    configTx?.Orderer?.Organizations,
    configTx?.Profiles?.MainChannel?.Application?.Organizations,
    configTx?.Profiles?.OrdererGenesis?.Orderer?.Organizations,
  ];

  for (const section of sections) {
    if (!Array.isArray(section)) {
      continue;
    }

    for (const organization of section) {
      if (!organization || typeof organization !== 'object') {
        continue;
      }

      uniquePush(organizations, organization.Name || organization.name, organization.ID || organization.Id || organization.id);
    }
  }

  return organizations;
}

function collectOrganizationsFromConnectionProfile(connectionProfile, channelName) {
  const organizations = new Map();
  const profileOrganizations = connectionProfile?.organizations;

  if (profileOrganizations && typeof profileOrganizations === 'object') {
    for (const [name, organization] of Object.entries(profileOrganizations)) {
      if (!organization || typeof organization !== 'object') {
        continue;
      }

      uniquePush(
        organizations,
        organization.name || name,
        organization.mspid || organization.mspId || organization.msp_id || organization.ID,
      );
    }
  }

  const channels = connectionProfile?.channels;
  if (channels && typeof channels === 'object') {
    const channelEntry = channelName ? channels[channelName] : null;
    const channelNames = channelEntry ? [channelName] : Object.keys(channels);

    for (const currentChannelName of channelNames) {
      const channel = channels[currentChannelName];
      const channelOrganizations = channel?.organizations;

      if (Array.isArray(channelOrganizations)) {
        for (const organizationName of channelOrganizations) {
          uniquePush(organizations, organizationName, profileOrganizations?.[organizationName]?.mspid || profileOrganizations?.[organizationName]?.mspId || profileOrganizations?.[organizationName]?.msp_id);
        }
      } else if (channelOrganizations && typeof channelOrganizations === 'object') {
        for (const [organizationName, organization] of Object.entries(channelOrganizations)) {
          uniquePush(
            organizations,
            organization?.name || organizationName,
            organization?.mspid || organization?.mspId || organization?.msp_id || organization?.ID || profileOrganizations?.[organizationName]?.mspid || profileOrganizations?.[organizationName]?.mspId || profileOrganizations?.[organizationName]?.msp_id,
          );
        }
      }
    }
  }

  const clientOrganization = normalizeString(connectionProfile?.client?.organization);
  if (clientOrganization) {
    const clientOrg = profileOrganizations?.[clientOrganization];
    uniquePush(
      organizations,
      clientOrganization,
      clientOrg?.mspid || clientOrg?.mspId || clientOrg?.msp_id || clientOrg?.ID,
    );
  }

  return organizations;
}

async function collectWorkspaceChannelName(workspacePath) {
  if (!workspacePath) {
    return null;
  }

  const absoluteWorkspacePath = path.resolve(workspacePath);
  const channelArtifactsDir = path.join(absoluteWorkspacePath, 'channel-artifacts');
  const exists = await fs.pathExists(channelArtifactsDir);
  if (!exists) {
    return null;
  }

  const files = await fs.readdir(channelArtifactsDir);
  const txFiles = files
    .filter((fileName) => fileName.toLowerCase().endsWith('.tx'))
    .sort((left, right) => left.localeCompare(right));

  if (txFiles.length === 1) {
    return path.basename(txFiles[0], '.tx');
  }

  return null;
}

async function collectWorkspaceOrganizations(workspacePath) {
  if (!workspacePath) {
    return new Map();
  }

  const absoluteWorkspacePath = path.resolve(workspacePath);
  const configTxPath = path.join(absoluteWorkspacePath, 'configtx.yaml');
  const configTx = await readYamlOrJsonFile(configTxPath);

  if (!configTx) {
    return new Map();
  }

  return collectOrganizationsFromConfigTx(configTx);
}

async function loadFabricConfigFallback() {
  try {
    return loadFabricConfig();
  } catch (error) {
    return null;
  }
}

function upsertRow(trx, tableName, conflictTarget, insertData, mergeData) {
  return trx(tableName)
    .insert(insertData)
    .onConflict(conflictTarget)
    .merge(mergeData)
    .returning('*');
}

function mapNetworkRow(row) {
  return {
    network_id: row.network_id,
    network_name: row.network_name,
  };
}

function mapChannelRow(row) {
  return {
    channel_id: row.channel_id,
    channel_name: row.channel_name,
  };
}

function mapOrganizationRow(row) {
  return {
    organization_id: row.organization_id,
    organization_name: row.organization_name,
    msp_id: row.msp_id,
  };
}

class BlockchainMetadataIngestService {
  async syncBlockchainMetadata({
    tenantId,
    createdBy,
    networkName,
    channelName,
    connectionProfilePath,
    workspacePath,
  }) {
    if (!isNonEmptyString(tenantId)) {
      throw new AppError('tenantId is required to sync Fabric metadata', 400, 'FABRIC_METADATA_TENANT_REQUIRED');
    }

    const normalizedTenantId = tenantId.trim();
    const normalizedCreatedBy = normalizeString(createdBy);
    const requestedNetworkName = normalizeString(networkName);
    const requestedChannelName = normalizeString(channelName);
    const normalizedWorkspacePath = normalizeString(workspacePath);
    const normalizedConnectionProfilePath = normalizeString(connectionProfilePath);

    const [workspaceOrganizations, connectionProfile, workspaceChannelName, fabricConfigFallback] = await Promise.all([
      collectWorkspaceOrganizations(normalizedWorkspacePath),
      readYamlOrJsonFile(normalizedConnectionProfilePath),
      collectWorkspaceChannelName(normalizedWorkspacePath),
      loadFabricConfigFallback(),
    ]);

    const resolvedNetworkName =
      requestedNetworkName ||
      normalizeString(connectionProfile?.name) ||
      (normalizedWorkspacePath ? normalizeString(path.basename(path.resolve(normalizedWorkspacePath))) : null);

    const resolvedChannelName =
      requestedChannelName ||
      workspaceChannelName ||
      normalizeString(connectionProfile?.channels && Object.keys(connectionProfile.channels)[0]) ||
      normalizeString(fabricConfigFallback?.channel_name);

    const organizations = new Map();
    for (const [key, organization] of workspaceOrganizations.entries()) {
      organizations.set(key, {
        organization_name: organization.organization_name,
        msp_id: organization.msp_id,
      });
    }

    const profileOrganizations = collectOrganizationsFromConnectionProfile(connectionProfile, resolvedChannelName);
    for (const [key, organization] of profileOrganizations.entries()) {
      const existing = organizations.get(key);
      if (!existing) {
        organizations.set(key, {
          organization_name: organization.organization_name,
          msp_id: organization.msp_id,
        });
        continue;
      }

      if (!existing.msp_id && organization.msp_id) {
        existing.msp_id = organization.msp_id;
      }
    }

    if (!resolvedNetworkName) {
      throw new AppError(
        'Unable to resolve a Fabric network name from the provided metadata sources',
        400,
        'FABRIC_METADATA_NETWORK_REQUIRED',
      );
    }

    if (!resolvedChannelName) {
      throw new AppError(
        'Unable to resolve a Fabric channel name from the provided metadata sources',
        400,
        'FABRIC_METADATA_CHANNEL_REQUIRED',
      );
    }

    if (organizations.size === 0) {
      throw new AppError(
        'Unable to resolve Fabric organizations from the provided metadata sources',
        400,
        'FABRIC_METADATA_ORGANIZATIONS_REQUIRED',
      );
    }

    try {
      return await db.transaction(async (trx) => {
        const [networkRow] = await upsertRow(
          trx,
          'blockchain_network',
          ['tenant_id', 'network_name'],
          {
            tenant_id: normalizedTenantId,
            network_name: resolvedNetworkName,
            created_by: normalizedCreatedBy,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          },
          {
            created_by: trx.raw('COALESCE(??, EXCLUDED.??)', ['created_by', 'created_by']),
            updated_at: trx.fn.now(),
          },
        );

        const [channelRow] = await upsertRow(
          trx,
          'channel',
          ['tenant_id', 'channel_name'],
          {
            channel_id: resolvedChannelName,
            tenant_id: normalizedTenantId,
            network_id: networkRow.network_id,
            channel_name: resolvedChannelName,
            created_by: normalizedCreatedBy,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          },
          {
            network_id: networkRow.network_id,
            created_by: trx.raw('COALESCE(??, EXCLUDED.??)', ['created_by', 'created_by']),
            updated_at: trx.fn.now(),
          },
        );

        const organizationRows = [];
        for (const organization of organizations.values()) {
          const insertData = {
            tenant_id: normalizedTenantId,
            organization_name: organization.organization_name,
            msp_id: organization.msp_id || null,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now(),
          };

          const mergeData = {
            updated_at: trx.fn.now(),
          };

          if (isNonEmptyString(organization.msp_id)) {
            mergeData.msp_id = organization.msp_id;
          }

          const [organizationRow] = await upsertRow(
            trx,
            'organizations',
            ['tenant_id', 'organization_name'],
            insertData,
            mergeData,
          );

          organizationRows.push(organizationRow);
        }

        return {
          network: mapNetworkRow(networkRow),
          channel: mapChannelRow(channelRow),
          organizations: organizationRows.map(mapOrganizationRow),
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        error.message || 'Failed to sync Fabric metadata',
        500,
        'FABRIC_METADATA_SYNC_FAILED',
      );
    }
  }
}

module.exports = new BlockchainMetadataIngestService();
