class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

const fabricSchema = require("../../validators/fabric/fabricSchema");
const AppError = require("../../utils/AppError");
const assetService = require("../fabric/assetRegistry");
const assetRegistryDao = require("../../dao/chaincodeMetadata/assetRegistryDao");
const networkProvisioningService = require('../fabric/networkProvisioningService')

class networkAssetsService {
  constructor() {
    this.schemas = fabricSchema;
  }

  validate(schemaKey, data) {
    const schema = this.schemas[schemaKey];

    if (!schema) {
      throw new Error(`Validation schema not found for key: ${schemaKey}`);
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      throw new ValidationError(
        "Validation failed",
        error.details.map((d) => d.message),
      );
    }

    return value;
  }




  // Copilot note: Blockchain/network methods - separated from asset registry operations
async networkCreate({ body, user }) {
  // Body should contain: { name, description?, orgs }
  // Convert body to config format expected by schema and validation
  const configData = {
    config: {
      name: body.name,
      orgs: body.orgs || [],
      // Use provided values or defaults
      consensus: body.consensus || 'etcdraft',
      channelPolicy: body.channelPolicy || 'MAJORITY',
      channelId: body.channelId || 'mychannel',
      stateDb: body.stateDb || 'couchdb',
      ordererCount: body.ordererCount || 1,
    }
  };

  const validated = this.validate("networkCreateSchema", configData);
  let { config } = validated;
  // Normalize org keys: tests and clients may send `msp_ID` or `msp_id`.
  config = {
    ...config,
    orgs: (config.orgs || []).map(org => ({
      ...org,
      mspId: org.mspId || org.msp_ID || org.msp_id || org.msp || undefined,
      peerCount: typeof org.peerCount === 'number' ? org.peerCount : (org.peerCount || 1),
    })),
  };
  const { name, orgs } = config;

  try {

    // const createdNetwork = await assetService.networkCreate({
    //   name,
    //   orgs,
    //   requestedBy: user?.uid,
    // });


    const orchestration = await networkProvisioningService.provisionNetwork({
      user_id: user?.uid,
      config
    })

    return {
      orchestration
    };
  } catch (err) {
    console.error('DEBUG networkCreate inner error:', err);
    throw err;
  }
}
  async networkRead({ params, user }) {
    throw new AppError(
      "Network read is not implemented",
      501,
      "NOT_IMPLEMENTED",
    );
  }

  async channelCreate({ params, body, user }) {
    const validated = this.validate("channelCreateSchema", { params, body });

    const { id } = validated.params;
    const { name, memberOrgs } = validated.body;

    return await assetService.channelCreate({
      id,
      name,
      memberOrgs,
      requestedBy: user?.uid,
    });
  }

  async channelRead({ params, user }) {
    throw new AppError(
      "Channel read is not implemented",
      501,
      "NOT_IMPLEMENTED",
    );
  }

  async smartContract({ params, body, user }) {
    const validated = this.validate("smartContractSchema", { params, body });

    const { contractType, contractName, version } = validated.body;

    return await assetService.smartContract({
      channel_id: validated.params.channel_id,
      contractType,
      contractName,
      version,
      requestedBy: user?.uid,
    });
  }

  async contractReadAll({ params, user }) {
    const validated = this.validate("contractReadAllSchema", { params });

    return await assetService.contractReadAll({
      channel_id: validated.params.channel_id,
      requestedBy: user?.uid,
    });
  }

  async createAsset({ body, user }) {
    if (!user?.tenantId) {
      throw new AppError('Tenant context required', 403, 'MISSING_TENANT_CONTEXT');
    }

    // Extract id from body if present, otherwise generate or require from params
    const { id, color, size, owner, appraisedValue } = body;
    
    if (!id) {
      throw new AppError('Asset ID is required', 400, 'ASSET_ID_REQUIRED');
    }

    // Validate using a simpler validation that just checks body fields
    const validated = {
      id,
      color: color && typeof color === 'string' ? color.trim() : null,
      size: typeof size === 'number' ? size : null,
      owner: owner && typeof owner === 'string' ? owner.trim() : null,
      appraisedValue: typeof appraisedValue === 'number' ? appraisedValue : null
    };

    if (!validated.color || !validated.size || !validated.owner || !validated.appraisedValue) {
      throw new ValidationError('Validation failed', ['Required fields missing in asset creation']);
    }

    await assetRegistryDao.createAsset({
      id,
      tenantId: user.tenantId,
      color: validated.color,
      size: validated.size,
      owner: validated.owner,
      appraisedValue: validated.appraisedValue,
      requestedBy: user.uid,
    });

    return await assetService.createAsset({
      id,
      tenantId: user.tenantId,
      color: validated.color,
      size: validated.size,
      owner: validated.owner,
      appraisedValue: validated.appraisedValue,
      requestedBy: user.uid,
    });
  }

  async assetTransfer({ params, body, user }) {
    if (!user?.tenantId) {
      throw new AppError('Tenant context required', 403, 'MISSING_TENANT_CONTEXT');
    }

    const validated = this.validate("assetTransferSchema", { params, body });

    const { id } = validated.params;
    const { owner } = validated.body;

    await assetRegistryDao.assetTransfer({
      id,
      tenantId: user.tenantId,
      owner,
      requestedBy: user.uid,
    });

    return await assetService.assetTransfer({
      id,
      tenantId: user.tenantId,
      owner,
      requestedBy: user.uid,
    });
  }

  async assetUpdate({ params, body, user }) {
    if (!user?.tenantId) {
      throw new AppError('Tenant context required', 403, 'MISSING_TENANT_CONTEXT');
    }

    const validated = this.validate("assetUpdateSchema", { params, body });

    const { id } = validated.params;
    const { color, size, owner, appraisedValue } = validated.body;

    await assetRegistryDao.assetUpdate({
      id,
      tenantId: user.tenantId,
      color,
      size,
      owner,
      appraisedValue,
      requestedBy: user.uid,
    });

    return await assetService.assetUpdate({
      id,
      tenantId: user.tenantId,
      color,
      size,
      owner,
      appraisedValue,
      requestedBy: user.uid,
    });
  }

  async assetDelete({ params, user }) {
    if (!user?.tenantId) {
      throw new AppError('Tenant context required', 403, 'MISSING_TENANT_CONTEXT');
    }

    const validated = this.validate("assetDeleteSchema", { params });

    const { id } = validated.params;

    await assetRegistryDao.assetDelete({
      id,
      tenantId: user.tenantId,
      requestedBy: user.uid,
    });

    return await assetService.assetDelete({
      id,
      tenantId: user.tenantId,
      requestedBy: user.uid,
    });
  }

  async assetRead({ params, user }) {
    if (!user?.tenantId) {
      throw new AppError('Tenant context required', 403, 'MISSING_TENANT_CONTEXT');
    }

    const validated = this.validate("assetReadSchema", { params });

    const { id } = validated.params;

    return await assetService.assetRead({
      id,
      tenantId: user.tenantId,
      requestedBy: user.uid,
    });
  }

  async assetReadAll({ user }) {
    if (!user?.tenantId) {
      throw new AppError('Tenant context required', 403, 'MISSING_TENANT_CONTEXT');
    }

    return await assetService.assetReadAll({
      tenantId: user.tenantId,
      requestedBy: user.uid,
    });
  }
}

module.exports = new networkAssetsService();
