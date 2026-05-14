const { createFirebaseAuthMock, registerFirebaseAdminMocks } = require('../../helpers/firebaseTestSetup');
const auth = createFirebaseAuthMock(vi);
registerFirebaseAdminMocks(vi, auth);

vi.mock('../../../controllers/blockchainController', () => ({
    networkCreate: vi.fn(),
    networkRead: vi.fn(),
    channelCreate: vi.fn(),
    smartContract: vi.fn(),
    contractReadAll: vi.fn()
}));

vi.mock('../../../controllers/organizationInviteController', () => ({
    createInvite: vi.fn(),
    getInviteByToken: vi.fn(),
    acceptInvite: vi.fn()
}));
vi.mock('../../../controllers/assetRegistryController.js', () => ({
    createAsset: vi.fn(),
    assetTransfer: vi.fn(),
    assetUpdate: vi.fn(),
    assetDelete: vi.fn(),
    assetRead: vi.fn(),
    assetReadAll: vi.fn()
}));
vi.mock('../../../controllers/approvalWorkflowController.js', () => ({
    createSubmission: vi.fn(),
    submitForApproval: vi.fn(),
    approveSubmission: vi.fn(),
    rejectSubmission: vi.fn(),
    requestChanges: vi.fn(),
    resubmitSubmission: vi.fn(),
    getSubmissionById: vi.fn(),
    getSubmissionHistory: vi.fn(),
    deleteSubmission: vi.fn()
}));
vi.mock('../../../dao/r2StorageDao', () => ({
    upload: vi.fn(),
    deleteObject: vi.fn(),
    getSignedUrl: vi.fn()
}));
vi.mock('../../../config/firebase-config', () => ({
    auth
}));
vi.mock('../../../middleware/uploadSubmissionFile.js', () => ({
    single: vi.fn(() => vi.fn((req, res, next) => next()))
}));

vi.mock('../../../middleware/authenticate', () => ({
    decodeToken: vi.fn((req, res, next) => next())
}));

vi.mock('../../../middleware/rateLimiter', () => ({
    apiLimiter: vi.fn((req, res, next) => next())
}));

const blockchainController = require('../../../controllers/blockchainController');
const assetRegistryController = require('../../../controllers/assetRegistryController');
const organizationInviteController = require('../../../controllers/organizationInviteController');
const approvalWorkflowController = require('../../../controllers/approvalWorkflowController');
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
        expect(findRoute('/networks', 'post').route.stack[0].handle).toBe(blockchainController.networkCreate);
        expect(findRoute('/networks/:network_id', 'get').route.stack[0].handle).toBe(blockchainController.networkRead);
        expect(findRoute('/networks/:id/channels', 'post').route.stack[0].handle).toBe(blockchainController.channelCreate);
        expect(findRoute('/channel/:channel_id/contracts', 'post').route.stack[0].handle).toBe(blockchainController.smartContract);
        expect(findRoute('/channel/:channel_id/contracts', 'get').route.stack[0].handle).toBe(blockchainController.contractReadAll);
    });

    it('registers member-management routes with current controller methods', () => {
        expect(findRoute('/organizations/:organization_id/invitations', 'post').route.stack[0].handle).toBe(organizationInviteController.createInvite);
        expect(findRoute('/organizations-invitations/:token', 'get').route.stack[0].handle).toBe(organizationInviteController.getInviteByToken);
        expect(findRoute('/organizations-invitations/:token/accept', 'post').route.stack[0].handle).toBe(organizationInviteController.acceptInvite);
    });

    it('registers asset registry routes with expected handlers', () => {
        expect(findRoute('/assets', 'post').route.stack[0].handle).toBe(assetRegistryController.createAsset);
        expect(findRoute('/assets/:id/transfer', 'post').route.stack[0].handle).toBe(assetRegistryController.assetTransfer);
        expect(findRoute('/assets/:id', 'put').route.stack[0].handle).toBe(assetRegistryController.assetUpdate);
        expect(findRoute('/assets/:id', 'delete').route.stack[0].handle).toBe(assetRegistryController.assetDelete);
        expect(findRoute('/assets/:id', 'get').route.stack[0].handle).toBe(assetRegistryController.assetRead);
        expect(findRoute('/assets', 'get').route.stack[0].handle).toBe(assetRegistryController.assetReadAll);
    });

    it('registers approval workflow routes with expected handlers', () => {
        const createSubmissionRoute = findRoute('/submissions', 'post');
        expect(createSubmissionRoute.route.stack[createSubmissionRoute.route.stack.length - 1].handle).toBe(approvalWorkflowController.createSubmission);
        expect(findRoute('/submissions/:submissionId/submit', 'post').route.stack[0].handle).toBe(approvalWorkflowController.submitForApproval);
        expect(findRoute('/submissions/:submissionId/approve', 'patch').route.stack[0].handle).toBe(approvalWorkflowController.approveSubmission);
        expect(findRoute('/submissions/:submissionId/reject', 'patch').route.stack[0].handle).toBe(approvalWorkflowController.rejectSubmission);
        expect(findRoute('/submissions/:submissionId/request-changes', 'patch').route.stack[0].handle).toBe(approvalWorkflowController.requestChanges);
        const resubmitRoute = findRoute('/submissions/:submissionId/resubmit', 'patch');
        expect(resubmitRoute.route.stack[resubmitRoute.route.stack.length - 1].handle).toBe(approvalWorkflowController.resubmitSubmission);
        expect(findRoute('/submissions/:submissionId', 'get').route.stack[0].handle).toBe(approvalWorkflowController.getSubmissionById);
        expect(findRoute('/submissions/:submissionId/history', 'get').route.stack[0].handle).toBe(approvalWorkflowController.getSubmissionHistory);
        expect(findRoute('/submissions/:submissionId', 'delete').route.stack[0].handle).toBe(approvalWorkflowController.deleteSubmission);
    });
});
