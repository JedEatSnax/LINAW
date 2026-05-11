const approvalWorkflowService = require('../service/application/approvalWorkflowService');

class approvalWorkflowController {
    // Approval Workflow
    async createSubmission(req, res, next) {
        try {
            const submission = await approvalWorkflowService.createSubmission({
                params: req.params,
                body: req.body,
                user: req.user,
                file: req.file
            })

            return res
                .status(201)
                .location(`/submissions/${submission.submissionId}`)
                .json({
                    success: true,
                    data: submission
                });
        } catch (error) {
            next(error)
        }
    }

    async submitForApproval(req, res, next) {
        try {
            const approval = await approvalWorkflowService.submitForApproval({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(approval)
        } catch (error) {
            next(error)
        }
    }

    async approveSubmission(req, res, next) {
        try {
            const approved = await approvalWorkflowService.approveSubmission({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(approved)
        } catch (error) {
            next(error)
        }
    }

    async rejectSubmission(req, res, next) {
        try {
            const rejection = await approvalWorkflowService.rejectSubmission({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(rejection)
        } catch (error) {
            next(error)
        }
    }

    async requestChanges(req, res, next) {
        try {
            const request = await approvalWorkflowService.requestChanges({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(request)
        } catch (error) {
            next(error)
        }
    }

    async resubmitSubmission(req, res, next) {
        try {
            const resubmit = await approvalWorkflowService.resubmitSubmission({
                params: req.params,
                body: req.body,
                user: req.user,
                file: req.file
            })

            return res.status(200).json(resubmit)
        } catch (error) {
            next(error)
        }
    }

    async getSubmissionById(req, res, next) {
        try {
            const { submissionId } = req.params;

            const result = await approvalWorkflowService.getSubmissionById({
                submissionId,
                user: req.user
            });

            return res.status(200).json({
                success: true,
                message: 'Submission retrieved successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async getSubmissionHistory(req, res, next) {
        try {
            const SubmissionHistory = await approvalWorkflowService.getSubmissionHistory({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(SubmissionHistory)
        } catch (error) {
            next(error)
        }
    }

    async deleteSubmission(req, res, next) {
        try {
            const deleteSubmission = await approvalWorkflowService.deleteSubmission({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(deleteSubmission)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new approvalWorkflowController();
