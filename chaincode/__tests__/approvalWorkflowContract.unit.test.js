const ApprovalWorkflowContract = require('../lib/approvalWorkflowContract');
const { createMockContext, getJsonFromPutStateCall, toBuffer } = require('./helpers/fabricMocks');

describe('ApprovalWorkflowContract', () => {
    let contract;

    const sample = {
        submissionId: 'sub-1001',
        owner: 'alice',
        role: 'requester',
        status: 'DRAFT',
        proposalType: 'BUDGET_REALLOCATION',
        docHash: '0xabc123'
    };

    beforeEach(() => {
        contract = new ApprovalWorkflowContract();
    });

    describe('createSubmission', () => {
        it('creates a new submission successfully', async () => {
            const { ctx, stub } = createMockContext({ attributes: { 'abac.member': 'true' } });

            const result = await contract.createSubmission(
                ctx,
                sample.submissionId,
                sample.owner,
                sample.role,
                sample.status,
                sample.proposalType,
                sample.docHash
            );

            const payload = JSON.parse(result);
            expect(payload).toEqual(sample);
            expect(stub.putState).toHaveBeenCalledTimes(1);
            expect(stub.putState).toHaveBeenCalledWith(sample.submissionId, expect.any(Buffer));
        });

        it('throws if submission already exists', async () => {
            const { ctx } = createMockContext({
                attributes: { 'abac.member': 'true' },
                state: { [sample.submissionId]: sample }
            });

            await expect(
                contract.createSubmission(
                    ctx,
                    sample.submissionId,
                    sample.owner,
                    sample.role,
                    sample.status,
                    sample.proposalType,
                    sample.docHash
                )
            ).rejects.toThrow(`The proposal ${sample.submissionId} already exists`);
        });

        it('throws if MSP is unauthorized', async () => {
            const { ctx } = createMockContext({
                mspId: 'OtherOrgMSP',
                attributes: { 'abac.member': 'true' }
            });

            await expect(
                contract.createSubmission(
                    ctx,
                    sample.submissionId,
                    sample.owner,
                    sample.role,
                    sample.status,
                    sample.proposalType,
                    sample.docHash
                )
            ).rejects.toThrow('Unauthorized: Only members of OrgMSP can perform this action. Current MSP: OtherOrgMSP');
        });

        it('throws if required ABAC attribute is missing', async () => {
            const { ctx } = createMockContext({ attributes: {} });

            await expect(
                contract.createSubmission(
                    ctx,
                    sample.submissionId,
                    sample.owner,
                    sample.role,
                    sample.status,
                    sample.proposalType,
                    sample.docHash
                )
            ).rejects.toThrow('Unauthorized: Missing required attribute abac.member=true');
        });

        it('writes the correct object to world state with putState', async () => {
            const { ctx, stub } = createMockContext({ attributes: { 'abac.member': 'true' } });

            await contract.createSubmission(
                ctx,
                sample.submissionId,
                sample.owner,
                sample.role,
                sample.status,
                sample.proposalType,
                sample.docHash
            );

            const stored = getJsonFromPutStateCall(stub.putState, 0);
            expect(stored).toEqual(sample);
        });
    });

    describe('readSubmission', () => {
        it('returns a submission as JSON string', async () => {
            const { ctx } = createMockContext({ state: { [sample.submissionId]: sample } });

            const result = await contract.readSubmission(ctx, sample.submissionId);
            expect(JSON.parse(result)).toEqual(sample);
        });

        it('throws when submission does not exist', async () => {
            const { ctx } = createMockContext();

            await expect(contract.readSubmission(ctx, sample.submissionId)).rejects.toThrow(
                `The proposal ${sample.submissionId} does not exist`
            );
        });
    });

    describe('submitForApproval', () => {
        it('submits a draft proposal', async () => {
            const { ctx, stub } = createMockContext({
                attributes: { 'abac.member': 'true' },
                state: { [sample.submissionId]: sample }
            });

            const result = await contract.submitForApproval(ctx, sample.submissionId, sample.owner);

            expect(JSON.parse(result)).toEqual({ ...sample, status: 'SUBMITTED' });
            expect(getJsonFromPutStateCall(stub.putState)).toEqual({ ...sample, status: 'SUBMITTED' });
        });

        it('throws for non-owner', async () => {
            const { ctx } = createMockContext({
                attributes: { 'abac.member': 'true' },
                state: { [sample.submissionId]: sample }
            });

            await expect(contract.submitForApproval(ctx, sample.submissionId, 'bob')).rejects.toThrow(
                'Unauthorized: Only alice can perform this action'
            );
        });
    });

    describe('approveSubmission', () => {
        it('approves a submitted proposal', async () => {
            const submitted = { ...sample, status: 'SUBMITTED' };
            const { ctx, stub } = createMockContext({
                attributes: { 'abac.approver': 'true' },
                state: { [sample.submissionId]: submitted }
            });

            const result = await contract.approveSubmission(ctx, sample.submissionId, 'manager-1', 'looks good');

            expect(JSON.parse(result)).toEqual({
                ...submitted,
                status: 'APPROVED',
                approver: 'manager-1',
                remarks: 'looks good'
            });
            expect(stub.putState).toHaveBeenCalledTimes(1);
        });

        it('throws when approver ABAC attribute is missing', async () => {
            const submitted = { ...sample, status: 'SUBMITTED' };
            const { ctx } = createMockContext({ state: { [sample.submissionId]: submitted } });

            await expect(
                contract.approveSubmission(ctx, sample.submissionId, 'manager-1', 'looks good')
            ).rejects.toThrow('Unauthorized: Missing required attribute abac.approver=true');
        });
    });

    describe('rejectSubmission', () => {
        it('rejects a submitted proposal', async () => {
            const submitted = { ...sample, status: 'SUBMITTED' };
            const { ctx } = createMockContext({
                attributes: { 'abac.approver': 'true' },
                state: { [sample.submissionId]: submitted }
            });

            const result = await contract.rejectSubmission(ctx, sample.submissionId, 'manager-2', 'insufficient detail');

            expect(JSON.parse(result)).toEqual({
                ...submitted,
                status: 'REJECTED',
                approver: 'manager-2',
                remarks: 'insufficient detail'
            });
        });
    });

    describe('requestChanges', () => {
        it('marks submission as changes requested', async () => {
            const submitted = { ...sample, status: 'SUBMITTED' };
            const { ctx } = createMockContext({
                attributes: { 'abac.approver': 'true' },
                state: { [sample.submissionId]: submitted }
            });

            const result = await contract.requestChanges(ctx, sample.submissionId, 'manager-3', 'add estimates');

            expect(JSON.parse(result)).toEqual({
                ...submitted,
                status: 'CHANGES_REQUESTED',
                approver: 'manager-3',
                remarks: 'add estimates'
            });
        });
    });

    describe('resubmitSubmission', () => {
        it('resubmits after changes requested', async () => {
            const needsChanges = { ...sample, status: 'CHANGES_REQUESTED' };
            const { ctx, stub } = createMockContext({
                attributes: { 'abac.member': 'true' },
                state: { [sample.submissionId]: needsChanges }
            });

            const result = await contract.resubmitSubmission(ctx, sample.submissionId, sample.owner, '0xdef456');

            expect(JSON.parse(result)).toEqual({
                ...needsChanges,
                status: 'RESUBMITTED',
                docHash: '0xdef456'
            });
            expect(getJsonFromPutStateCall(stub.putState)).toEqual({
                ...needsChanges,
                status: 'RESUBMITTED',
                docHash: '0xdef456'
            });
        });

        it('throws for invalid status transition', async () => {
            const submitted = { ...sample, status: 'SUBMITTED' };
            const { ctx } = createMockContext({
                attributes: { 'abac.member': 'true' },
                state: { [sample.submissionId]: submitted }
            });

            await expect(
                contract.resubmitSubmission(ctx, sample.submissionId, sample.owner, '0xdef456')
            ).rejects.toThrow('Invalid status transition. Expected CHANGES_REQUESTED, current status is SUBMITTED');
        });
    });

    describe('deleteSubmission', () => {
        it('deletes an existing submission', async () => {
            const { ctx, stub } = createMockContext({
                attributes: { 'abac.member': 'true' },
                state: { [sample.submissionId]: sample }
            });

            const result = await contract.deleteSubmission(ctx, sample.submissionId, sample.owner);

            expect(JSON.parse(result)).toEqual(sample);
            expect(stub.deleteState).toHaveBeenCalledWith(sample.submissionId);
        });

        it('throws when submission does not exist', async () => {
            const { ctx } = createMockContext({ attributes: { 'abac.member': 'true' } });

            await expect(contract.deleteSubmission(ctx, sample.submissionId, sample.owner)).rejects.toThrow(
                `The proposal ${sample.submissionId} does not exist`
            );
        });
    });

    describe('getSubmissionHistory', () => {
        it('returns submission history entries', async () => {
            const historyRecord = {
                txId: 'tx-1',
                timestamp: { seconds: 1, nanos: 0 },
                isDelete: false,
                value: toBuffer(sample)
            };

            const { ctx, stub } = createMockContext({
                state: { [sample.submissionId]: sample },
                historyByKey: { [sample.submissionId]: [historyRecord] }
            });

            const result = await contract.getSubmissionHistory(ctx, sample.submissionId);
            const parsed = JSON.parse(result);

            expect(stub.getHistoryForKey).toHaveBeenCalledWith(sample.submissionId);
            expect(parsed).toEqual({
                submissionId: sample.submissionId,
                history: [
                    {
                        txId: 'tx-1',
                        timestamp: { seconds: 1, nanos: 0 },
                        isDelete: false,
                        value: sample
                    }
                ]
            });
        });

        it('throws when submission does not exist', async () => {
            const { ctx } = createMockContext();

            await expect(contract.getSubmissionHistory(ctx, sample.submissionId)).rejects.toThrow(
                `The proposal ${sample.submissionId} does not exist`
            );
        });
    });

    describe('submissionHistory compatibility alias', () => {
        test.todo('add an alias test if chaincode introduces submissionHistory() separate from getSubmissionHistory()');
    });
});
