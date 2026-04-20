class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

const fabricSchema = require("../validators/fabric/fabricSchema");
const AppError = require("../utils/AppError");
const assetService = require("./fabric/assetRegistry");

class appFabricService {
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

  async networkCreate({ body, user }) {
    const validated = this.validate("networkCreateSchema", { body });

    const { name, description, orgs } = validated.body;

    return await assetService.networkCreate({
      name,
      description,
      orgs,
      requestedBy: user?.uid,
    });
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
    const validated = this.validate("createAssetSchema", { body });

    const { id, color, size, owner, appraisedValue } = validated.body;

    return await assetService.createAsset({
      id,
      color,
      size,
      owner,
      appraisedValue,
      requestedBy: user?.uid,
    });
  }

  async assetTransfer({ params, body, user }) {
    const validated = this.validate("assetTransferSchema", { params, body });

    const { id } = validated.params;
    const { owner } = validated.body;

    return await assetService.assetTransfer({
      id,
      owner,
      requestedBy: user?.uid,
    });
  }

  async assetUpdate({ params, body, user }) {
    const validated = this.validate("assetUpdateSchema", { params, body });

    const { id } = validated.params;
    const { color, size, owner, appraisedValue } = validated.body;

    return await assetService.assetUpdate({
      id,
      color,
      size,
      owner,
      appraisedValue,
      requestedBy: user?.uid,
    });
  }

  async assetDelete({ params, user }) {
    const validated = this.validate("assetDeleteSchema", { params });

    const { id } = validated.params;

    return await assetService.assetDelete({
      id,
      requestedBy: user?.uid,
    });
  }

  async assetRead({ params, user }) {
    const validated = this.validate("assetReadSchema", { params });

    const { id } = validated.params;

    return await assetService.assetRead({
      id,
      requestedBy: user?.uid,
    });
  }

  async assetReadAll({ user }) {
    return await assetService.assetReadAll({
      requestedBy: user?.uid,
    });
  }
}

module.exports = new appFabricService();
