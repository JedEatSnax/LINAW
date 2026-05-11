const AppError = require("../../utils/AppError.js");
const { TextDecoder } = require("node:util");
const fabricGateway = require("../../config/fabric/fabricGateway.js");

function getContractFromGateway(contractName) {
  return fabricGateway.getContract(contractName);
}

function parseBuffer(resultBuffer) {
  if (!resultBuffer || resultBuffer.length === 0) {
    return null;
  }

  const resultString = resultBuffer.toString();

  try {
    return JSON.parse(resultString);
  } catch (error) {
    return resultString;
  }
}

class assetRegistry {
  async createAsset({ id, tenantId, color, size, owner, appraisedValue, requestedBy }) {
    try {
      const contract = getContractFromGateway("assetRegistryContract");

      const result = await contract.submitTransaction(
        "CreateAsset",
        id,
        tenantId,
        color,
        String(size),
        owner,
        String(appraisedValue),
      );

      return {
        message: "Asset Created Succesfully",
        requested_by: requestedBy,
        data: parseBuffer(result),
      };
    } catch (error) {
      throw new AppError(
        error.message || "Failed to create asset",
        500,
        "FABRIC_CREATE_ASSSET_ERROR",
      );
    }
  }

  async assetTransfer({ id, tenantId, owner, requestedBy }) {
    try {
      const contract = getContractFromGateway("assetRegistryContract");

      const commit = await contract.submitAsync("TransferAsset", {
        arguments: [id, tenantId, owner],
      });

      const result = commit.getResult();

      const status = await commit.getStatus();
      if (!status.successful) {
        throw new Error(
          `Transaction ${status.transactionId} failed to commit with status code ${String(status.code)}`,
        );
      }

      return {
        message: "Asset Transferred Successfully",
        requested_by: requestedBy,
        data: parseBuffer(result),
      };
    } catch (error) {
      throw new AppError(
        error.message || "Failed to transfer asset",
        500,
        "FABRIC_TRANSFER_ASSET_ERROR",
      );
    }
  }

  async assetUpdate({ id, tenantId, color, size, owner, appraisedValue, requestedBy }) {
    try {
      const contract = getContractFromGateway("assetRegistryContract");

      const result = await contract.submitTransaction(
        "UpdateAsset",
        id,
        tenantId,
        color,
        String(size),
        owner,
        String(appraisedValue),
      );

      return {
        message: "Asset Updated Successfully",
        requested_by: requestedBy,
        data: parseBuffer(result),
      };
    } catch (error) {
      throw new AppError(
        error.message || "Failed to update asset",
        500,
        "FABRIC_UPDATE_ASSET_ERROR",
      );
    }
  }

  async assetDelete({ id, tenantId, requestedBy }) {
    try {
      const contract = getContractFromGateway("assetRegistryContract");

      const commit = await contract.submitAsync("DeleteAsset", {
        arguments: [id, tenantId],
      });

      const result = commit.getResult();

      const status = await commit.getStatus();
      if (!status.successful) {
        throw new Error(
          `Transaction ${status.transactionId} failed to commit with status code ${String(status.code)}`,
        );
      }

      return {
        message: "Asset Deleted Successfully",
        requested_by: requestedBy,
        data: parseBuffer(result),
      };
    } catch (error) {
      throw new AppError(
        error.message || "Failed to delete asset",
        500,
        "FABRIC_DELETE_ASSET_ERROR",
      );
    }
  }

  async assetRead({ id, tenantId, requestedBy }) {
    try {
      const contract = getContractFromGateway("assetRegistryContract");

      const result = await contract.evaluateTransaction("ReadAsset", id, tenantId);

      return {
        message: "Asset fetched successfully",
        requested_by: requestedBy,
        data: parseBuffer(result),
      };
    } catch (error) {
      throw new AppError(
        error.message || "Failed to fetch asset",
        500,
        "FAILED_READ_ASSET_ERROR",
      );
    }
  }

  async assetReadAll({ tenantId, requestedBy }) {
    try {
      const contract = getContractFromGateway("assetRegistryContract");

      const result = await contract.evaluateTransaction("GetAllAssets", tenantId);

      return {
        message: "Assets fetched successfully",
        requested_by: requestedBy,
        data: parseBuffer(result),
      };
    } catch (error) {
      throw new AppError(
        error.message || "Failed to fetch all asset",
        500,
        "FABRIC_READ_ALL_ASSETS_ERROR",
      );
    }
  }
}

module.exports = new assetRegistry();
