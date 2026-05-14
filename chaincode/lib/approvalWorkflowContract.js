'use strict';

const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class ApprovalWorkflowContract extends Contract {
    constructor() {
        super('approvalWorkflowContract');
    }

    async submissionExists(ctx, submissionId) {
        const submissionJSON = await ctx.stub.getState(submissionId);
        return submissionJSON && submissionJSON.length > 0;
    }

    async _getSubmission(ctx, submissionId) {
        const submissionJSON = await ctx.stub.getState(submissionId);

        if (!submissionJSON || submissionJSON.length === 0) {
            throw new Error(`The proposal ${submissionId} does not exist`);
        }

        return JSON.parse(submissionJSON.toString());
    }

    async readSubmission(ctx, submissionId) {
        const submission = await this._getSubmission(ctx, submissionId);
        return JSON.stringify(submission);
    }

    _requireMSP(ctx, allowedMspId) {
        const mspId = ctx.clientIdentity.getMSPID();

        if (mspId !== allowedMspId) {
            throw new Error(
                `Unauthorized: Only members of ${allowedMspId} can perform this action. Current MSP: ${mspId}`
            );
        }
    }

    _requireAttribute(ctx, attrName, expectedValue) {
        const ok = ctx.clientIdentity.assertAttributeValue(attrName, expectedValue);

        if (!ok) {
            throw new Error(
                `Unauthorized: Missing required attribute ${attrName}=${expectedValue}`
            );
        }
    }

    _requireStatus(submission, ...expectedStatuses) {
        if (!expectedStatuses.includes(submission.status)) {
            const msg = expectedStatuses.length === 1
                ? `Invalid status transition. Expected ${expectedStatuses[0]}, current status is ${submission.status}`
                : `Invalid status transition. Expected one of ${expectedStatuses.join(', ')}, current status is ${submission.status}`;

            throw new Error(msg);
        }
    }

    _requireOwner(submission, owner) {
        if (submission.owner !== owner) {
            throw new Error(
                `Unauthorized: Only ${submission.owner} can perform this action`
            );
        }
    }

    async _putSubmission(ctx, submissionId, submission) {
        await ctx.stub.putState(
            submissionId,
            Buffer.from(stringify(sortKeysRecursive(submission)))
        );
    }

    async createSubmission(ctx, submissionId, owner, role, status, proposalType, docHash) {
        const exists = await this.submissionExists(ctx, submissionId);

        if (exists) {
            throw new Error(`The proposal ${submissionId} already exists`);
        }

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.member', 'true');

        const submission = {
            submissionId,
            owner,
            role,
            status: 'DRAFT',
            proposalType,
            docHash
        };

        await this._putSubmission(ctx, submissionId, submission);
        return JSON.stringify(submission);
    }

    async deleteSubmission(ctx, submissionId, owner) {
        const submission = await this._getSubmission(ctx, submissionId);

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.member', 'true');
        this._requireOwner(submission, owner);

        await ctx.stub.deleteState(submissionId);
        return JSON.stringify(submission);
    }

    async submitForApproval(ctx, submissionId, owner) {
        const submission = await this._getSubmission(ctx, submissionId);

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.member', 'true');
        this._requireOwner(submission, owner);
        this._requireStatus(submission, 'DRAFT', 'RESUBMITTED');

        submission.status = 'SUBMITTED';

        await this._putSubmission(ctx, submissionId, submission);
        return JSON.stringify(submission);
    }

    async approveSubmission(ctx, submissionId, approver, remarks) {
        const submission = await this._getSubmission(ctx, submissionId);

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.approver', 'true');
        this._requireStatus(submission, 'SUBMITTED', 'RESUBMITTED');

        submission.status = 'APPROVED';
        submission.approver = approver;
        submission.remarks = remarks;

        await this._putSubmission(ctx, submissionId, submission);
        return JSON.stringify(submission);
    }

    async rejectSubmission(ctx, submissionId, approver, remarks) {
        const submission = await this._getSubmission(ctx, submissionId);

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.approver', 'true');
        this._requireStatus(submission, 'SUBMITTED', 'RESUBMITTED');

        submission.status = 'REJECTED';
        submission.approver = approver;
        submission.remarks = remarks;

        await this._putSubmission(ctx, submissionId, submission);
        return JSON.stringify(submission);
    }

    async requestChanges(ctx, submissionId, approver, remarks) {
        const submission = await this._getSubmission(ctx, submissionId);

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.approver', 'true');
        this._requireStatus(submission, 'SUBMITTED', 'RESUBMITTED');

        submission.status = 'CHANGES_REQUESTED';
        submission.approver = approver;
        submission.remarks = remarks;

        await this._putSubmission(ctx, submissionId, submission);
        return JSON.stringify(submission);
    }

    async resubmitSubmission(ctx, submissionId, owner, newDocHash) {
        const submission = await this._getSubmission(ctx, submissionId);

        this._requireMSP(ctx, 'OrgMSP');
        this._requireAttribute(ctx, 'abac.member', 'true');
        this._requireOwner(submission, owner);
        this._requireStatus(submission, 'CHANGES_REQUESTED');

        submission.docHash = newDocHash;
        submission.status = 'RESUBMITTED';

        await this._putSubmission(ctx, submissionId, submission);
        return JSON.stringify(submission);
    }

    async getSubmissionHistory(ctx, submissionId) {
        const exists = await this.submissionExists(ctx, submissionId);

        if (!exists) {
            throw new Error(`The proposal ${submissionId} does not exist`);
        }

        const iterator = await ctx.stub.getHistoryForKey(submissionId);
        const history = [];

        for await (const record of iterator) {
            let value = null;

            if (!record.isDelete && record.value && record.value.length > 0) {
                value = JSON.parse(record.value.toString('utf8'));
            }

            history.push({
                txId: record.txId,
                timestamp: record.timestamp,
                isDelete: record.isDelete,
                value
            });
        }

        return JSON.stringify({
            submissionId,
            history
        });
    }
}

module.exports = ApprovalWorkflowContract;