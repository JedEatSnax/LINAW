function createFirebaseAuthMock(vi) {
    return {
        verifyIdToken: vi.fn()
    };
}

function registerFirebaseAdminMocks(vi, auth) {
    vi.mock('firebase-admin/app', () => ({
        initializeApp: vi.fn(() => ({})),
        cert: vi.fn(() => ({}))
    }));

    vi.mock('firebase-admin/auth', () => ({
        getAuth: vi.fn(() => auth)
    }));
}

module.exports = {
    createFirebaseAuthMock,
    registerFirebaseAdminMocks
};
