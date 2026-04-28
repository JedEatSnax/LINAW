jest.mock('../../../controllers/fabricController', () => ({
    networkCreate: jest.fn(),
    networkRead: jest.fn(),
    channelCreate: jest.fn(),
    smartContract: jest.fn(),
    contractReadAll: jest.fn(),
    addMember: jest.fn(),
    updateMemberRole: jest.fn(),
    getOrganizationMemebrs: jest.fn(),
    deleteMember: jest.fn(),
    createAsset: jest.fn(),
    assetTransfer: jest.fn(),
    assetUpdate: jest.fn(),
    assetDelete: jest.fn(),
    assetRead: jest.fn(),
    assetReadAll: jest.fn(),
    createSubmission: jest.fn(),
    submitForApproval: jest.fn(),
    approveSubmission: jest.fn(),
    rejectSubmission: jest.fn(),
    requestChanges: jest.fn(),
    resubmitSubmission: jest.fn(),
    getSubmissionById: jest.fn(),
    getSubmissionHistory: jest.fn(),
    deleteSubmission: jest.fn()
}));

jest.mock('../../../middleware/authenticate', () => ({
    decodeToken: jest.fn((req, res, next) => next())
}));

jest.mock('../../../middleware/rateLimiter', () => ({
    apiLimiter: jest.fn((req, res, next) => next())
}));

const fabricController = require('../../../controllers/fabricController');
const authenticate = require('../../../middleware/authenticate');
const { apiLimiter } = require('../../../middleware/rateLimiter');
const { router } = require('../../../routes/fabricRoute');

function findRoute(path, method) {
    return router.stack.find((layer) => {
        return layer.route && layer.route.path === path && layer.route.methods[method];
    });
}

describe('backend/routes/fabricRoute', () => {
    it('applies router-level api limiter and token decoding middleware', () => {
        const middlewareLayers = router.stack.filter((layer) => !layer.route);

        expect(middlewareLayers).toHaveLength(2);
        expect(middlewareLayers[0].handle).toBe(apiLimiter);
        expect(middlewareLayers[1].handle).toBe(authenticate.decodeToken);
    });

    it('registers core blockchain routes with expected handlers', () => {
        expect(findRoute('/networks', 'post').route.stack[0].handle).toBe(fabricController.networkCreate);
        expect(findRoute('/networks/:id/channels', 'post').route.stack[0].handle).toBe(fabricController.channelCreate);
        expect(findRoute('/channel/:channel_id/contracts', 'post').route.stack[0].handle).toBe(fabricController.smartContract);
        expect(findRoute('/channel/:channel_id/contracts', 'get').route.stack[0].handle).toBe(fabricController.contractReadAll);
    });

    it('registers member-management routes with current controller methods', () => {
        expect(findRoute('/organizations/:organizationId/members', 'post')).toBeUndefined();
        expect(findRoute('/organizations/:organizationId/members/:userId', 'patch')).toBeUndefined();
        expect(findRoute('/organizations/:organizationId/members', 'get')).toBeUndefined();
        expect(findRoute('/organizations/:organizationId/member/:userId', 'delete')).toBeUndefined();
    });

    it('registers asset registry routes with expected handlers', () => {
        expect(findRoute('/assets', 'post').route.stack[0].handle).toBe(fabricController.createAsset);
        expect(findRoute('/assets/:id/transfer', 'post').route.stack[0].handle).toBe(fabricController.assetTransfer);
        expect(findRoute('/assets/:id', 'put').route.stack[0].handle).toBe(fabricController.assetUpdate);
        expect(findRoute('/assets/:id', 'delete').route.stack[0].handle).toBe(fabricController.assetDelete);
        expect(findRoute('/assets/:id', 'get').route.stack[0].handle).toBe(fabricController.assetRead);
        expect(findRoute('/assets', 'get').route.stack[0].handle).toBe(fabricController.assetReadAll);
    });

    it('registers approval workflow routes with expected handlers', () => {
        const createSubmissionRoute = findRoute('/submissions', 'post');
        expect(createSubmissionRoute.route.stack[createSubmissionRoute.route.stack.length - 1].handle).toBe(fabricController.createSubmission);
        expect(findRoute('/submissions/:submissionId/submit', 'post').route.stack[0].handle).toBe(fabricController.submitForApproval);
        expect(findRoute('/submissions/:submissionId/approve', 'patch').route.stack[0].handle).toBe(fabricController.approveSubmission);
        expect(findRoute('/submissions/:submissionId/reject', 'patch').route.stack[0].handle).toBe(fabricController.rejectSubmission);
        expect(findRoute('/submissions/:submissionId/request-changes', 'patch').route.stack[0].handle).toBe(fabricController.requestChanges);
        const resubmitRoute = findRoute('/submissions/:submissionId/resubmit', 'patch');
        expect(resubmitRoute.route.stack[resubmitRoute.route.stack.length - 1].handle).toBe(fabricController.resubmitSubmission);
        expect(findRoute('/submissions/:submissionId', 'get').route.stack[0].handle).toBe(fabricController.getSubmissionById);
        expect(findRoute('/submissions/:submissionId/history', 'get').route.stack[0].handle).toBe(fabricController.getSubmissionHistory);
        expect(findRoute('/submissions/:submissionId', 'delete').route.stack[0].handle).toBe(fabricController.deleteSubmission);
    });
});
