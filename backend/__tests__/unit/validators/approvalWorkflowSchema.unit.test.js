describe('backend/validators/fabric/approvalWorkflowsSchema', () => {
    it('loads successfully and exports expected schemas', () => {
        expect(() => {
            require('../../../validators/fabric/approvalWorkflowsSchema');
        }).not.toThrow();

        const schemas = require('../../../validators/fabric/approvalWorkflowsSchema');
        expect(schemas).toMatchObject({
            createSubmission: expect.any(Object),
            deleteSubmission: expect.any(Object),
            submitForApproval: expect.any(Object),
            approveSubmission: expect.any(Object),
            requestChanges: expect.any(Object),
            rejectSubmission: expect.any(Object),
            resubmitSubmission: expect.any(Object),
            getSubmissionById: expect.any(Object),
            getSubmissionHistory: expect.any(Object)
        });
    });
});
