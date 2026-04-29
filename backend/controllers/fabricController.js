const networkAssetsService = require('../service/application/networkAssetsService')
const approvalWorkflowService = require('../service/application/approvalWorkflowService');

class fabricController {
    async networkCreate(req, res, next) {
        try {
            const network = await networkAssetsService.networkCreate({
                body: req.body,
                user: req.user
            })

            return res.status(201).json(network)
            } catch (error) {
                next(error)
        }
    }

    async networkRead (req, res, next) {
        try {
            const read = await networkAssetsService.networkRead({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(read)
        } catch (error) {
            next(error)
        }
    }


    async channelCreate (req, res, next) {
        try {
            const channel = await networkAssetsService.channelCreate({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(201).json(channel)
        } catch (error) {
            next(error)
        }
    }

    async channelRead (req, res, next) {
       try {
            const read = await networkAssetsService.channelRead({
            params: req.params,
            user: req.user
            })

              return res.status(200).json(read)
       } catch (error) {
            next(error)
       }
    }

    async smartContract (req, res, next) {
        try {
            const contract = await networkAssetsService.smartContract({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(201).json(contract)
        } catch (error) {
            next(error)
        }
    }

    async contractReadAll (req, res, next) {
        try {
            const contracts = await networkAssetsService.contractReadAll({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(contracts)
        } catch (error) {
            next(error)
        }
    }

    async createSubmission (req, res, next) {
        try{
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

    async submitForApproval     (req, res, next) {
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

    async approveSubmission     (req, res, next) {
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

    async rejectSubmission      (req, res, next) {
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

    async requestChanges        (req, res, next) {
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

    async resubmitSubmission    (req, res, next) {
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

    async getSubmissionHistory  (req, res, next) {
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

    async deleteSubmission      (req, res, next) {
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

    async createAsset(req,res, next) {
        try {
            const create = await networkAssetsService.createAsset({
                body: req.body,
                user: req.user
            })

            return res.status(201).json(create)
        } catch (error) {
            next(error)
        }
    }

    async assetTransfer (req, res, next) {
        try {
            const transfer = await networkAssetsService.assetTransfer({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(transfer)
        } catch (error) {
            next(error)
        }
    }

    async assetUpdate (req, res, next) {
        try {
            const update = await networkAssetsService.assetUpdate({
                params: req.params,
                body: req.body,
                user: req.user
            })

            return res.status(200).json(update)
        } catch (error) {
            next(error)
        }
    }

    async assetDelete (req, res, next) {
        try {
            const deleted = await networkAssetsService.assetDelete({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(deleted)
        } catch (error) {
            next(error)
        }
    }

    async assetRead (req, res, next) {
        try {
            const read = await networkAssetsService.assetRead({
                params: req.params,
                user: req.user
            })

            return res.status(200).json(read)
        } catch (error) {
            next(error)
        }
    }

    async assetReadAll (req, res, next) {
        try {
            const readAll = await networkAssetsService.assetReadAll({
                user: req.user
            })

            return res.status(200).json(readAll)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new fabricController()